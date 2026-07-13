import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserNotificationReadEvent } from '../../../domain/events/user-notification-read.event';

@EventsHandler(UserNotificationReadEvent)
export class OnUserNotificationReadHandler
  implements IEventHandler<UserNotificationReadEvent>
{
  private readonly logger = new Logger(OnUserNotificationReadHandler.name);

  handle(event: UserNotificationReadEvent): void {
    this.logger.log(
      `UserNotification read: id=${event.snapshot.id} userId=${event.snapshot.userId}`,
    );
  }
}
