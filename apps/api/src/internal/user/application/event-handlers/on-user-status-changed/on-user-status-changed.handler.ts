import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IUserAccessPort } from '@ce/nestjs-shared-auth';
import { UserStatusChangedEvent } from '../../../domain/events/user-status-changed.event';
import { UserStatus } from '../../../domain/enums/user-status.enum';

/**
 * Handles UserStatusChangedEvent:
 * - Invalidates Auth2's user-access:{sub} cache whenever the user's status changes
 *   so the next request re-fetches the updated profile from the DB.
 *
 * This is critical for BLOCKED status changes: without cache invalidation a blocked
 * user's cached AuthUser stays valid until the default 30-minute TTL expires.
 *
 * Note: the DELETED path is handled separately by OnUserDeletedHandler which also
 * sends the deactivation email. This handler fires for ALL status transitions
 * (DRAFT→ACTIVE, ACTIVE→BLOCKED, BLOCKED→ACTIVE, *→DELETED) so it is safe to
 * let both handlers run — invalidate is idempotent.
 */
@Injectable()
@EventsHandler(UserStatusChangedEvent)
export class OnUserStatusChangedHandler implements IEventHandler<UserStatusChangedEvent> {
  private readonly logger = new Logger(OnUserStatusChangedHandler.name);

  constructor(
    @Inject(IUserAccessPort) private readonly userAccess: IUserAccessPort,
  ) {}

  async handle(event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(
      `User status changed: ${event.userId} ${event.previousStatus} → ${event.newStatus}`,
    );

    if(event.newStatus == UserStatus.DELETED){
      //TODO delete All References like custom fields etc in the database
    }

    if (!event.idpSub) {
      this.logger.debug(
        `Skipping cache invalidation for ${event.userId} — idpSub not yet linked`,
      );
      return;
    }

    await this.userAccess.invalidate(event.idpSub);
    this.logger.debug(`Auth2 cache invalidated for ${event.idpSub}`);
  }
}
