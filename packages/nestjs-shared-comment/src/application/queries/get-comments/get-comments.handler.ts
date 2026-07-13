import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil, EntityTypeForbiddenError, EntityAccessDeniedError, checkEntityRecordAccess } from '@ce/nestjs-shared-core';
import { Comment2ModuleOptions } from '../../../comment.schema';
import { COMMENT2_OPTIONS } from '../../../infrastructure/comment-options.token';
import {
  COMMENT_ENTITY_ACCESS_PORT,
  ICommentEntityAccessPort,
} from '../../../domain/ports/entity-access.port';
import { ICommentRepository } from '../../../domain/repositories/comment.repository';
import { GetCommentsResponseDto } from '../../dtos/comment.dtos';
import { CommentResponseMapper } from '../../mappers/comment-response.mapper';
import { GetCommentsQuery } from './get-comments.query';

@QueryHandler(GetCommentsQuery)
@Injectable()
export class GetCommentsHandler
  implements IQueryHandler<GetCommentsQuery, GetCommentsResponseDto>
{
  constructor(
    @Inject(ICommentRepository)
    private readonly repo: ICommentRepository,
    @Inject(COMMENT2_OPTIONS)
    private readonly options: Comment2ModuleOptions,
    @Optional()
    @Inject(COMMENT_ENTITY_ACCESS_PORT)
    private readonly accessPort: ICommentEntityAccessPort | null,
  ) {}

  async execute({ params: q }: GetCommentsQuery): Promise<GetCommentsResponseDto> {
    try {
      // 1. Allowlist + permission check
      const entityConfig = EntityTypePolicyUtil.findConfig(
        q.entityType,
        this.options.allowedEntityTypes,
        'COMMENT',
      );
      EntityTypePolicyUtil.assertHasPermission(
        entityConfig?.readPermissions,
        q.userPermissions,
        'read',
        q.entityType,
        'COMMENT',
      );

      // 2. Optional record-level access check
      await checkEntityRecordAccess(
        this.accessPort,
        {
          entityType: q.entityType,
          entityId: q.entityId,
          userId: q.userId,
          userPermissions: q.userPermissions,
          action: 'read',
        },
        'COMMENT',
      );
    } catch (err) {
      if (err instanceof EntityTypeForbiddenError || err instanceof EntityAccessDeniedError) {
        return { hasAccess: false, reason: err.errorCode, message: err.message, comments: [], total: 0 };
      }
      throw err;
    }

    const { comments, total } = await this.repo.findByEntity(
      q.entityType,
      q.entityId,
      q.limit,
      q.offset,
    );
    return {
      hasAccess: true,
      comments: comments.map((c) => CommentResponseMapper.toDto(c)),
      total,
    };
  }
}
