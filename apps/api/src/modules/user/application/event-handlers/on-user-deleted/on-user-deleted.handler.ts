import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IUserAccessPort } from '@nabarun-ngo/nestjs-shared-auth';
import { CorrespondenceRequestEvent } from '@nabarun-ngo/nestjs-shared-correspondence';
import { UserDeletedEvent } from '../../../domain/events/user-deleted.event';

/**
 * Handles UserDeletedEvent:
 * - Invalidates Auth2's user-access:{sub} cache so the soft-deleted user's
 *   cached profile is evicted immediately.
 * - Sends a deactivation email via Correspondence2.
 *   overrideEmails bypasses IUserLookupPort resolution because the user is
 *   soft-deleted (deletedAt is set) and findById returns null at this point.
 */
@Injectable()
@EventsHandler(UserDeletedEvent)
export class OnUserDeletedHandler implements IEventHandler<UserDeletedEvent> {
  private readonly logger = new Logger(OnUserDeletedHandler.name);

  constructor(
    @Inject(IUserAccessPort) private readonly userAccess: IUserAccessPort,
    private readonly eventBus: EventBus,
  ) { }

  async handle(event: UserDeletedEvent): Promise<void> {
    this.logger.log(`User deleted: ${event.userId} (${event.email})`);

    if (event.idpSub) {
      await this.userAccess.invalidate(event.idpSub);
    }

    this.eventBus.publish(
      new CorrespondenceRequestEvent({
        recipients: { mode: 'users', userIds: [event.userId] },
        channels: {
          email: {
            templateKey: 'USER_DEACTIVATED',
            templateData: { email: event.email },
            overrideEmails: [event.email],
          },
        },
      }),
    );
    this.logger.debug(`Deactivation email dispatched for ${event.email}`);

    // TODO: cleanup DMS profile documents if Dms2 is wired

    // TODO: delete UserCustomField records for event.userId when the custom-fields module is implemented
  }
}
