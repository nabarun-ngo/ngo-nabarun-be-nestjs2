import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { NotificationCreatedEvent } from '../../../domain/events/notification-created.event';

/**
 * Side-effect handler: logs audit trail when a notification is persisted.
 * Future extensions can emit analytics events, update dashboards, etc.
 */
@EventsHandler(NotificationCreatedEvent)
export class OnNotificationCreatedHandler
  implements IEventHandler<NotificationCreatedEvent>
{
  private readonly logger = new Logger(OnNotificationCreatedHandler.name);

  handle(event: NotificationCreatedEvent): void {
    this.logger.log(
      `Notification created: id=${event.snapshot.id} type=${event.snapshot.type}`,
    );
  }
}
