import { Inject, Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  CorrespondenceRequestEvent,
  NotificationCategory,
  NotificationType,
} from '@ce/nestjs-shared-core';
import { CommentAddedEvent } from '../../../domain/events/comment-added.event';
import { COMMENT2_OPTIONS } from '../../../infrastructure/comment-options.token';
import { Comment2ModuleOptions } from '../../../comment.schema';

/**
 * Reacts to CommentAddedEvent and notifies all active resource subscribers of
 * the parent entity (identified by entityType + entityId) via in-app, email,
 * and push.
 *
 * Suppressed when options.notifications.notifySubscribers === false.
 */
@EventsHandler(CommentAddedEvent)
@Injectable()
export class OnCommentAddedSubscriberHandler implements IEventHandler<CommentAddedEvent> {
  constructor(
    private readonly eventBus: EventBus,
    @Inject(COMMENT2_OPTIONS) private readonly options: Comment2ModuleOptions,
  ) {}

  handle(event: CommentAddedEvent): void {
    if (this.options.notifications?.notifySubscribers === false) return;

    const templateKey = this.options.notifications?.subscriberTemplateKey ?? 'COMMENT_ADDED';
    const comment = event.snapshot;

    // Exclude the comment author and any @mentioned users — they receive
    // dedicated notifications and should not get a duplicate subscriber alert.
    const excludeUserIds = [
      comment.authorId,
      ...comment.mentionItems.map((m) => m.mentionedUserId),
    ];

    this.eventBus.publish(
      new CorrespondenceRequestEvent({
        recipients: {
          mode: 'resource',
          referenceType: comment.entityType,
          referenceId: comment.entityId,
          excludeUserIds,
        },
        channels: {
          inApp: {
            title: 'New comment added',
            body: `${comment.authorName} added a comment.`,
            type: NotificationType.INFO,
            category: NotificationCategory.WORKFLOW,
            referenceId: comment.id,
            referenceType: 'comment',
          },
          email: {
            templateKey,
            templateData: {
              authorName: comment.authorName,
              entityType: comment.entityType,
              entityId: comment.entityId,
              commentId: comment.id,
            },
          },
          push: { enabled: true },
        },
      }),
    );
  }
}
