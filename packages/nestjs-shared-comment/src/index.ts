// Module
export { Comment2Module as CommentModule } from './comment.module';
export { Comment2ModuleOptions as CommentModuleOptions , EntityTypeAccessConfig as CommentEntityTypeAccessConfig } from './comment.schema';

// Domain — errors
export {
  CommentNotFoundError,
  CommentAccessDeniedError,
  CommentEntityTypeForbiddenError,
  CommentOwnershipError,
  CommentParentMismatchError,
} from './domain/errors/comment.errors';

// Domain — events (pure data carriers emitted by the aggregate)
export { CommentAddedEvent } from './domain/events/comment-added.event';
export { CommentUpdatedEvent } from './domain/events/comment-updated.event';
export { CommentDeletedEvent } from './domain/events/comment-deleted.event';

// Application — events (emitted by handlers, NOT by the aggregate)
export { CommentMentionEvent } from './application/events/comment-mention.event';

// Domain — aggregates and entities (needed by persistence adapters)
export { Comment } from './domain/aggregates/comment.aggregate';
export { CommentMention } from './domain/entities/comment-mention.entity';

// Domain — ports and repository (consumers need these to provide implementations)
export {
  COMMENT_ENTITY_ACCESS_PORT,
  ICommentEntityAccessPort,
  CommentAccessAction,
} from './domain/ports/entity-access.port';
export {
  ICommentRepository,
  CommentFilter,
} from './domain/repositories/comment.repository';
export { MentionInput } from './domain/repositories/mention-input';

// Domain — entity type config (exported so consumers can type allowedEntityTypes)
export type { EntityTypeConfig } from './comment.schema';

// Application — DTOs
export {
  CreateCommentDto,
  UpdateCommentDto,
  MentionDto,
  GetCommentsQueryDto,
  GetCommentsResponseDto,
  CommentResponseDto,
  CommentMentionResponseDto,
} from './application/dtos/comment.dtos';

// Infrastructure — options token (needed when consumers inject COMMENT2_OPTIONS)
export { COMMENT2_OPTIONS as COMMENT_OPTIONS} from './infrastructure/comment-options.token';
