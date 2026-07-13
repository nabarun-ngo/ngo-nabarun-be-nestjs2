import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SubscriptionDeactivatedEvent } from '../../../domain/events/subscription-deactivated.event';

@EventsHandler(SubscriptionDeactivatedEvent)
export class OnSubscriptionDeactivatedHandler
  implements IEventHandler<SubscriptionDeactivatedEvent>
{
  private readonly logger = new Logger(OnSubscriptionDeactivatedHandler.name);

  handle(event: SubscriptionDeactivatedEvent): void {
    this.logger.log(
      `Subscription deactivated: id=${event.snapshot.id} ` +
        `userId=${event.snapshot.userId ?? event.snapshot.roleName}`,
    );
  }
}
