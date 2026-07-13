import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SubscriptionReactivatedEvent } from '../../../domain/events/subscription-reactivated.event';

@EventsHandler(SubscriptionReactivatedEvent)
export class OnSubscriptionReactivatedHandler
  implements IEventHandler<SubscriptionReactivatedEvent>
{
  private readonly logger = new Logger(OnSubscriptionReactivatedHandler.name);

  handle(event: SubscriptionReactivatedEvent): void {
    this.logger.log(
      `Subscription reactivated: id=${event.snapshot.id} ` +
        `userId=${event.snapshot.userId ?? event.snapshot.roleName}`,
    );
  }
}
