import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';
import type { Comment } from '../aggregates/comment.aggregate';

export type CommentDeletedSnapshot = Pick<Comment, 'id' | 'entityType' | 'entityId'>;

/** Emitted by Comment.softDelete(). */
export class CommentDeletedEvent extends DomainEvent<CommentDeletedSnapshot> {
  constructor(snapshot: CommentDeletedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
