import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  DocumentReferenceWhereInput,
  DocumentReferenceWhereUniqueInput,
  DocumentReferenceOrderByWithRelationInput,
} from '../prisma/models';
import { DocumentFilter, IDocumentRepository } from '@ce/nestjs-shared-dms';
import { Document } from '@ce/nestjs-shared-dms/domain/aggregates/document.aggregate';
import { DocumentMapping } from '@ce/nestjs-shared-dms/domain/entities/document-mapping.entity';
import { FileMetadata } from '@ce/nestjs-shared-dms/domain/value-objects/file-metadata.vo';
import { DocumentVisibility } from '@ce/nestjs-shared-dms/domain/enums/document-visibility.enum';

type MappingRow = {
  id: string;
  entityId: string;
  entityType: string;
  createdAt: Date;
};

/**
 * Local row shape for DocumentReference with included mappings and soft-delete
 * columns. The `updatedAt` / `deletedAt` fields are added by a pending schema
 * migration; `as any` casts bridge the gap where the generated types do not
 * yet reflect those columns.
 */
type DocumentReferenceRow = {
  id: string;
  fileName: string;
  remotePath: string;
  publicToken: string | null;
  contentType: string;
  fileSize: number | null;
  isPublic: boolean;
  uploadedById: string | null;
  storageOwnerSub: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  mappings?: MappingRow[];
};

const INCLUDE_MAPPINGS = { mappings: true } as const;

/**
 * Prisma-backed implementation of {@link IDocumentRepository}.
 *
 * Delegate key: `'documentReference'` (Prisma model `DocumentReference`).
 *
 * Overrides `create` and `update` to eager-load the `mappings` relation in a
 * single round-trip. `toInclude()` handles eager-loading for all find methods.
 * Custom methods (`findAllByEntity`, `countByEntity`) query the `mappings`
 * relation directly via `this.delegate`.
 *
 * `supportsSoftDelete()` returns `true`: list / count queries automatically
 * exclude soft-deleted rows, and `delete()` sets `deletedAt` instead of
 * removing the row (requires a schema migration to add `deletedAt` to
 * `DocumentReference`).
 */
@Injectable()
export class DocumentPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'documentReference',
    Document,
    string,
    DocumentFilter,
    DocumentReferenceRow,
    DocumentReferenceWhereInput,
    DocumentReferenceWhereUniqueInput,
    any,
    any,
    DocumentReferenceOrderByWithRelationInput,
    typeof INCLUDE_MAPPINGS
  >
  implements IDocumentRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'documentReference');
  }

  // ── toInclude hook — eager-loads mappings on all find queries ─────────────

  protected override toInclude(): typeof INCLUDE_MAPPINGS {
    return INCLUDE_MAPPINGS;
  }

  // ── Method overrides ───────────────────────────────────────────────────────

  /** Inserts the document row + nested mapping rows in one round-trip. */
  override async create(entity: Document): Promise<Document> {
    const row = await (this.delegate).create({
      data: this.toCreateInput(entity),
      include: INCLUDE_MAPPINGS,
    });
    return this.toDomain(row as DocumentReferenceRow);
  }

  /** Updates mutable fields and returns the refreshed aggregate with mappings. */
  override async update(id: string, entity: Document): Promise<Document> {
    const row = await (this.delegate).update({
      where: this.toUniqueWhere(id),
      data: this.toUpdateInput(id, entity),
      include: INCLUDE_MAPPINGS,
    });
    return this.toDomain(row as DocumentReferenceRow);
  }

  // ── IDocumentRepository custom queries ─────────────────────────────────────

  /** Returns all non-deleted documents whose mappings include this entity. */
  async findAllByEntity(entityType: string, entityId: string): Promise<Document[]> {
    const rows = await (this.delegate).findMany({
      where: {
        deletedAt: null,
        mappings: { some: { entityType, entityId } },
      },
      include: INCLUDE_MAPPINGS,
      orderBy: { createdAt: 'desc' },
    });
    return (rows as DocumentReferenceRow[]).map((row) => this.toDomain(row));
  }

  /** Counts non-deleted documents whose mappings include this entity. */
  async countByEntity(entityType: string, entityId: string): Promise<number> {
    return (this.delegate).count({
      where: {
        deletedAt: null,
        mappings: { some: { entityType, entityId } },
      },
    });
  }

  // ── PrismaCrudRepositoryBase abstract mapping hooks ────────────────────────

  protected toDomain(row: DocumentReferenceRow): Document {
    const mappings = (row.mappings ?? []).map(
      (m) => new DocumentMapping(m.id, m.entityId, m.entityType, m.createdAt),
    );
    // MEDIUM-1: Legacy rows may have a NULL fileSize. FileMetadata.of() requires a
    // positive number, so we use 1 as a sentinel for "unknown size" to prevent crashes
    // on historical data. New uploads always carry the real byte count.
    const metadata = FileMetadata.of(
      row.fileName,
      row.contentType,
      row.fileSize ?? 1,
    );
    const visibility = row.isPublic
      ? DocumentVisibility.Public
      : DocumentVisibility.Private;
    return new Document(
      row.id,
      metadata,
      row.remotePath,
      row.publicToken ?? '',
      mappings,
      visibility,
      row.uploadedById ?? undefined,
      row.storageOwnerSub ?? undefined,
      row.createdAt,
      row.updatedAt ?? undefined,
      row.deletedAt ?? undefined,
    );
  }

  protected toCreateInput(entity: Document): any {
    return {
      id: entity.id,
      fileName: entity.fileName,
      remotePath: entity.remotePath,
      publicToken: entity.publicToken ?? null,
      contentType: entity.contentType,
      fileSize: entity.fileSize,
      isPublic: entity.visibility === DocumentVisibility.Public,
      uploadedById: entity.uploadedById ?? null,
      storageOwnerSub: entity.storageOwnerSub ?? null,
      createdAt: entity.createdAt,
      mappings: {
        create: [...entity.mappings].map((m) => ({
          id: m.id,
          entityId: m.refId,
          entityType: m.refType,
          createdAt: m.createdAt,
        })),
      },
    };
  }

  /**
   * Only mutable scalar fields — mappings are written once at create time and
   * never re-created on update.
   */
  protected toUpdateInput(_id: string, entity: Document): any {
    return {
      publicToken: entity.publicToken ?? null,
      isPublic: entity.visibility === DocumentVisibility.Public,
      fileName: entity.fileName,
      updatedAt: entity.updatedAt ?? null,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  protected toUniqueWhere(id: string): DocumentReferenceWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: DocumentFilter): DocumentReferenceWhereInput {
    return {
      ...(filter?.uploadedById ? { uploadedById: filter.uploadedById } : {}),
      ...(filter?.refType || filter?.refId
        ? {
            mappings: {
              some: {
                ...(filter?.refType ? { entityType: filter.refType } : {}),
                ...(filter?.refId ? { entityId: filter.refId } : {}),
              },
            },
          }
        : {}),
    };
  }

  protected defaultOrderBy(): DocumentReferenceOrderByWithRelationInput {
    return { createdAt: 'desc' };
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }
}
