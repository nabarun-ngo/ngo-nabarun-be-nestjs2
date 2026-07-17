import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence'
import { PrismaClient } from '../prisma/client';
import {
  CommentWhereInput,
  CommentWhereUniqueInput,
  CommentOrderByWithRelationInput,
} from '../prisma/models';
import {
  Comment,
  CommentFilter,
  CommentMention,
  ICommentRepository,
  MentionInput,
} from '@ce/nestjs-shared-comment';

/**
 * Local row shape — includes new columns (authorName, mention.displayName,
 * mention.email) that exist in our schema but not yet in the generated types.
 */
type MentionRow = {
  commentId: string;
  mentionedUserId: string;
  displayName: string;
  email: string;
  createdAt: Date;
};

type CommentRow = {
  id: string;
  content: string;
  authorId: string;
  authorName: string | null;
  entityType: string;
  entityId: string;
  parentId: string | null;
  deletedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  mentions?: MentionRow[];
};

/**
 * Hard cap on rows fetched per entity in a single findByEntity call.
 * Roots + all replies are fetched in one query; this guards against
 * unbounded result sets on entities with many comments.
 */
const MAX_COMMENTS_PER_ENTITY = 1000;

const INCLUDE_MENTIONS = { mentions: true } as const;

/** Shared mention data shape for Prisma nested createMany. */
type MentionCreateData = { mentionedUserId: string; displayName: string; email: string };

function mentionsCreatePayload(items: CommentMention[]): { createMany: { data: MentionCreateData[] } } | undefined {
  if (!items.length) return undefined;
  return {
    createMany: {
      data: items.map((m) => ({
        mentionedUserId: m.mentionedUserId,
        displayName: m.displayName,
        email: m.email,
      })),
    },
  };
}

@Injectable()
export class PrismaCommentRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'comment',
    Comment,
    string,
    CommentFilter,
    CommentRow,
    CommentWhereInput,
    CommentWhereUniqueInput,
    any,
    any,
    CommentOrderByWithRelationInput,
    typeof INCLUDE_MENTIONS
  >
  implements ICommentRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'comment');
  }

  // ── toInclude hook — eager-loads mentions on all find queries ─────────────

  protected override toInclude(): typeof INCLUDE_MENTIONS {
    return INCLUDE_MENTIONS;
  }

  // ── Overrides ─────────────────────────────────────────────────────────────

  /**
   * Single query: INSERT the comment row + all its mentions in one round trip
   * using Prisma's nested createMany. Eliminates the separate syncMentions call
   * that would otherwise add 2 more queries.
   */
  override async create(entity: Comment): Promise<Comment> {
    await this.client.comment.create({
      data: {
        ...(this.toCreateInput(entity)),
        mentions: mentionsCreatePayload(entity.mentionItems),
      },
    });
    return entity;
  }

  /**
   * Single query: UPDATE the comment row and atomically replace all its mentions
   * (deleteMany + createMany inside Prisma's implicit nested transaction).
   * Eliminates the separate syncMentions call.
   */
  override async update(id: string, entity: Comment): Promise<Comment> {
    await this.client.comment.update({
      where: { id },
      data: {
        ...(this.toUpdateInput(id, entity)),
        mentions: {
          deleteMany: {},
          ...(entity.mentionItems.length > 0
            ? { createMany: { data: entity.mentionItems.map((m) => ({
                mentionedUserId: m.mentionedUserId,
                displayName: m.displayName,
                email: m.email,
              })) } }
            : {}),
        },
      },
    });
    return entity;
  }

  /**
   * Override: recursive CTE cascades soft-delete to all descendant replies.
   * The base soft-delete only marks the single row.
   */
  override async delete(id: string): Promise<void> {
    await this.client.$executeRawUnsafe(
      `
      WITH RECURSIVE descendants AS (
        SELECT id FROM "comment" WHERE id = $1
        UNION ALL
        SELECT c.id FROM "comment" c
        INNER JOIN descendants d ON c."parentId" = d.id
      )
      UPDATE "comment"
      SET "deletedAt" = NOW(), "updatedAt" = NOW()
      WHERE id IN (SELECT id FROM descendants)
      `,
      id,
    );
  }

  // ── ICommentRepository custom methods ─────────────────────────────────────

  /**
   * Single query: fetches all non-deleted comments for the entity (roots +
   * replies + mentions) in one round trip, then assembles the reply tree and
   * paginates roots in memory.
   *
   * Why one query instead of two:
   *   - Root pagination (limit/offset) is applied after the flat fetch.
   *   - The result set is bounded by MAX_COMMENTS_PER_ENTITY so the in-memory
   *     work is always O(n) with a fixed upper bound.
   *   - Avoids the race between two separate findMany calls.
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ comments: Comment[]; total: number }> {
    const allRows = await this.client.comment.findMany({
      where: { entityType, entityId, deletedAt: null },
      include: INCLUDE_MENTIONS,
      orderBy: { createdAt: 'asc' },
      take: MAX_COMMENTS_PER_ENTITY,
    });

    // Build domain objects + segregate roots from replies in one pass
    const byId = new Map<string, Comment>();
    const roots: Comment[] = [];
    const childMap = new Map<string, Comment[]>();

    for (const row of allRows) {
      const comment = this.toDomain(row as unknown as CommentRow);
      byId.set(comment.id, comment);
      if (!row.parentId) {
        roots.push(comment);
      } else {
        const siblings = childMap.get(row.parentId) ?? [];
        siblings.push(comment);
        childMap.set(row.parentId, siblings);
      }
    }

    // Attach children to their parents
    for (const [parentId, children] of childMap) {
      byId.get(parentId)?.setReplies(children);
    }

    // Apply root-level pagination; default limit is 50
    const total = roots.length;
    const from = offset ?? 0;
    const to = from + (limit ?? 50);
    return { comments: roots.slice(from, to), total };
  }

  /**
   * Explicit full-replace for edge cases (e.g. mention repair jobs).
   * Normal create/update flows do NOT call this — mentions are synced
   * atomically inside the overridden create() and update() above.
   */
  async syncMentions(commentId: string, mentions: MentionInput[]): Promise<void> {
    await this.$transaction(async (tx) => {
      await (tx).commentMention.deleteMany({ where: { commentId } });
      if (mentions.length > 0) {
        await (tx).commentMention.createMany({
          data: mentions.map((m) => ({
            commentId,
            mentionedUserId: m.userId,
            displayName: m.displayName,
            email: m.email,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  // ── PrismaCrudRepositoryBase abstract mapping hooks ───────────────────────

  protected toDomain(row: CommentRow): Comment {
    const mentionItems = (row.mentions ?? []).map(
      (m) => new CommentMention(m.commentId, m.mentionedUserId, m.displayName, m.email, m.createdAt),
    );
    return Comment.rehydrate(
      row.id,
      row.content,
      row.authorId,
      row.authorName ?? '',
      row.entityType,
      row.entityId,
      row.parentId ?? undefined,
      row.createdAt,
      row.updatedAt,
      [],
      mentionItems,
      row.deletedAt,
    );
  }

  protected toCreateInput(entity: Comment): any {
    return {
      id: entity.id,
      content: entity.content,
      authorId: entity.authorId,
      authorName: entity.authorName,
      entityType: entity.entityType,
      entityId: entity.entityId,
      parentId: entity.parentId ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: 0,
    };
  }

  protected toUpdateInput(_id: string, entity: Comment): any {
    return {
      content: entity.content,
      updatedAt: entity.updatedAt,
      version: { increment: 1 },
    };
  }

  protected toUniqueWhere(id: string): CommentWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: CommentFilter): CommentWhereInput {
    return {
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.entityId ? { entityId: filter.entityId } : {}),
    };
  }

  protected defaultOrderBy(): CommentOrderByWithRelationInput {
    return { createdAt: 'asc' };
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }
}
