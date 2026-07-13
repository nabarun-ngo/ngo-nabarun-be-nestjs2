import { Inject, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CorrespondenceRequestEvent } from '../events/correspondence-request.event';
import { SubscriptionResolutionService } from '../services/subscription-resolution.service';
import { INotificationRepository } from '../../domain/repositories/notification.repository';
import { IDispatchQueuePort, DISPATCH_QUEUE_PORT } from '../../domain/ports/dispatch-queue.port';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { UserNotification } from '../../domain/aggregates/user-notification.aggregate';
import { NotificationPriority } from '../../domain/enums/notification-type.enum';

@EventsHandler(CorrespondenceRequestEvent)
export class Correspondence2Orchestrator
  implements IEventHandler<CorrespondenceRequestEvent> {
  private readonly logger = new Logger(Correspondence2Orchestrator.name);

  constructor(
    private readonly resolutionService: SubscriptionResolutionService,
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
    @Inject(DISPATCH_QUEUE_PORT)
    private readonly dispatchQueue: IDispatchQueuePort,
    private readonly eventBus: EventBus,
  ) { }

  async handle(event: CorrespondenceRequestEvent): Promise<void> {
    const dispatchId = randomUUID();
    this.logger.log(`Processing CorrespondenceRequestEvent dispatchId=${dispatchId}`);

    try {
      const { inApp, email, push } = event.channels;

      const resolved = await this.resolutionService.resolve(
        event.recipients,
        email?.overrideEmails,
        email?.cc,
      );

      if (resolved.targetUserIds.length === 0 && resolved.emailTo.length === 0) {
        this.logger.warn(`dispatchId=${dispatchId} resolved to zero recipients — skipping.`);
        return;
      }

      // Persist the in-app notification record only when the inApp channel is requested.
      let notificationId: string | undefined;
      let userNotificationIds: string[] | undefined;

      if (inApp) {
        const notification = Notification.create({
          title: inApp.title,
          body: inApp.body,
          type: inApp.type,
          category: inApp.category,
          priority: inApp.priority ?? NotificationPriority.NORMAL,
          action: inApp.action,
          referenceId: inApp.referenceId,
          referenceType: inApp.referenceType,
          imageUrl: inApp.imageUrl,
          icon: inApp.icon,
          metadata: inApp.metadata,
          expiresAt: inApp.expiresAt,
          dispatchId,
        });

        const userNotifications = resolved.targetUserIds.map((uid) =>
          UserNotification.create({ notificationId: notification.id, userId: uid }),
        );

        await this.notificationRepo.createWithUserNotifications(notification, userNotifications);
        notificationId = notification.id;

        const notifEvents = [...notification.domainEvents];
        notification.clearEvents();
        this.eventBus.publishAll(notifEvents);

        const pushUserIdSet = new Set(resolved.pushUserIds);
        userNotificationIds = userNotifications
          .filter((un) => pushUserIdSet.has(un.userId))
          .map((un) => un.id);
      }

      await this.dispatchQueue.enqueue({
        dispatchId,
        notificationId,
        targetUserIds: resolved.targetUserIds,
        userNotificationIds,
        pushUserIds: resolved.pushUserIds,
        templateKey: email?.templateKey,
        templateData: email?.templateData,
        emailAddresses: resolved.emailTo,
        ccAddresses: resolved.emailCc,
        sendEmail: !!email?.templateKey && resolved.emailTo.length > 0,
        sendPush: (push?.enabled ?? false) && resolved.pushUserIds.length > 0,
      });

      this.logger.log(
        `dispatchId=${dispatchId} queued — ` +
        `inApp=${!!inApp}, ` +
        `users=${resolved.targetUserIds.length}, ` +
        `emailTo=${resolved.emailTo.length}, ` +
        `pushUsers=${resolved.pushUserIds.length}`,
      );
    } catch (error) {
      this.logger.error(
        `dispatchId=${dispatchId} orchestration failed`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
