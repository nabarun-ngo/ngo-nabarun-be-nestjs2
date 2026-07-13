import { Inject, Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  CorrespondenceRequestEvent,
  NotificationCategory,
  NotificationType,
} from '@ce/nestjs-shared-correspondence';
import { CommentMentionEvent } from '../../events/comment-mention.event';
import { COMMENT2_OPTIONS } from '../../../infrastructure/comment-options.token';
import { Comment2ModuleOptions } from '../../../comment.schema';

@EventsHandler(CommentMentionEvent)
@Injectable()
export class OnCommentMentionedHandler implements IEventHandler<CommentMentionEvent> {
  constructor(
    private readonly eventBus: EventBus,
    @Inject(COMMENT2_OPTIONS) private readonly options: Comment2ModuleOptions,
  ) { }

  handle(event: CommentMentionEvent): void {
    const templateKey = this.options.notifications?.mentionTemplateKey ?? 'COMMENT_MENTION';
    const { snapshot: comment, newMentions } = event;

    for (const mention of newMentions) {
      this.eventBus.publish(
        new CorrespondenceRequestEvent({
          recipients: {
            mode: 'users',
            userIds: [mention.userId],
          },
          channels: {
            inApp: {
              title: `${comment.authorName} mentioned you in a comment`,
              body: `You were mentioned in a comment on ${comment.entityType} ${comment.entityId}.`,
              type: NotificationType.INFO,
              category: NotificationCategory.WORKFLOW,
              referenceId: comment.id,
              referenceType: 'comment',
            },
            email: {
              templateKey,
              overrideEmails: [mention.email],
              templateData: {
                authorName: comment.authorName,
                displayName: mention.displayName,
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
}
