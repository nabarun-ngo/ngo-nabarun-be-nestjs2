import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IUserAccessPort } from 'nestjs-shared/auth';
import { UserProfileUpdatedEvent } from '../../../domain/events/user-profile-updated.event';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';

/**
 * Handles UserProfileUpdatedEvent:
 * - Syncs name/picture to Auth0 (updateUser).
 * - Invalidates Auth2's user-access:{sub} cache so the next request re-fetches
 *   `profile_complete` fresh from the DB via UserLookupAdapter.
 */
@Injectable()
@EventsHandler(UserProfileUpdatedEvent)
export class OnUserProfileUpdatedHandler
  implements IEventHandler<UserProfileUpdatedEvent> {
  private readonly logger = new Logger(OnUserProfileUpdatedHandler.name);

  constructor(
    @Inject(IIdentityProvider) private readonly identityProvider: IIdentityProvider,
    @Inject(IUserAccessPort) private readonly userAccess: IUserAccessPort,
  ) { }

  async handle(event: UserProfileUpdatedEvent): Promise<void> {
    if (!event.idpSub) return;

    try {
      await this.identityProvider.updateUser(event.idpSub, {
        firstName: event.firstName,
        lastName: event.lastName,
        picture: event.picture,
      });
    } catch (err) {
      this.logger.error(
        `Failed to sync Auth0 for user ${event.userId}: ${err instanceof Error ? err.message : err}`,
      );
    }

    // Flush Auth2's cached AuthUser so profile_complete is re-fetched on the next request
    await this.userAccess.invalidate(event.idpSub);
  }
}
