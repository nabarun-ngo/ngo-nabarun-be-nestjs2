import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AuthFacade } from '@ce/nestjs-shared-auth';
import { CorrespondenceRequestEvent } from '@ce/nestjs-shared-correspondence';
import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { USER_OPTIONS } from '../../../infrastructure/user-options.token';
import type { UserModuleOptions } from '../../../user.schema';

/**
 * Handles UserCreatedEvent:
 * - If systemGeneratedPassword: sends a welcome email via Correspondence2 to inform
 *   the user their account is ready and to watch for the password-reset link from the IdP.
 * - Grants each key in `defaultRoleKeys` via AuthFacade when the user has an idpSub.
 *   Role grant failures are logged but never propagate — the user record already exists.
 *
 * AuthFacade is provided by AuthModule. UserModule must be imported AFTER AuthModule
 * in the consuming app for this injection to resolve.
 */
@Injectable()
@EventsHandler(UserCreatedEvent)
export class OnUserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(OnUserCreatedHandler.name);

  constructor(
    @Inject(USER_OPTIONS) private readonly options: UserModuleOptions,
    private readonly eventBus: EventBus,
    private readonly authFacade: AuthFacade,
  ) { }

  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`User created: ${event.userId} (${event.email})`);

    if (event.systemGeneratedPassword) {
      this.eventBus.publish(
        new CorrespondenceRequestEvent({
          recipients: { mode: 'users', userIds: [event.userId] },
          channels: {
            email: {
              templateKey: 'USER_WELCOME',
              templateData: { email: event.email },
            },
          },
        }),
      );
      this.logger.debug(`Welcome email dispatched for ${event.email}`);
    }

    if (this.options.defaultRoleKeys.length > 0 && event.idpSub) {
      for (const roleKey of this.options.defaultRoleKeys) {
        try {
          await this.authFacade.grantRole(event.idpSub, roleKey, event.userId);
          this.logger.debug(`Granted role '${roleKey}' to ${event.idpSub}`);
        } catch (err) {
          this.logger.error(
            `Failed to grant default role '${roleKey}' to ${event.idpSub}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }
    }
  }
}
