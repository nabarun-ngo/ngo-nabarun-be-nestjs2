import { DynamicModule, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { z } from 'zod';
import { BaseDynamicModule, DynamicModuleAsyncOptions, createRequiredPortsGuard } from '@ce/nestjs-shared-core';
import { Correspondence2OptionsSchema } from './correspondence.schema';
import { CORRESPONDENCE2_OPTIONS } from './correspondence-options.token';

export { CORRESPONDENCE2_OPTIONS };

import { INotificationRepository } from './domain/repositories/notification.repository';
import { IUserNotificationRepository } from './domain/repositories/user-notification.repository';
import { IResourceSubscriptionRepository } from './domain/repositories/resource-subscription.repository';
import { EMAIL_SENDER_PORT } from './domain/ports/email-sender.port';
import { PUSH_NOTIFICATION_PORT } from './domain/ports/push-notification.port';
import { DISPATCH_QUEUE_PORT } from './domain/ports/dispatch-queue.port';
import { TEMPLATE_PORT } from './domain/ports/template.port';
import { IEmailDispatchPort } from './application/ports/email-dispatch.port';

import { Correspondence2Orchestrator } from './application/orchestrator/correspondence-orchestrator';
import { SubscriptionResolutionService } from './application/services/subscription-resolution.service';
import { EmailDispatchService } from './application/services/email-dispatch.service';
import { RetentionSchedulerService } from './application/services/retention-scheduler.service';

import { MarkUserNotificationReadHandler } from './application/commands/mark-user-notification-read/mark-user-notification-read.handler';
import { MarkAllUserNotificationsReadHandler } from './application/commands/mark-all-user-notifications-read/mark-all-user-notifications-read.handler';
import { ArchiveUserNotificationHandler } from './application/commands/archive-user-notification/archive-user-notification.handler';
import { SubscribeUserHandler } from './application/commands/subscribe-user/subscribe-user.handler';
import { SubscribeRoleHandler } from './application/commands/subscribe-role/subscribe-role.handler';
import { UnsubscribeUserHandler } from './application/commands/unsubscribe-user/unsubscribe-user.handler';
import { UnsubscribeRoleHandler } from './application/commands/unsubscribe-role/unsubscribe-role.handler';
import { UpdateChannelConfigHandler } from './application/commands/update-channel-config/update-channel-config.handler';
import { UpdateSubscriberEmailHandler } from './application/commands/update-subscriber-email/update-subscriber-email.handler';
import { ResendPushHandler } from './application/commands/resend-push/resend-push.handler';

import { GetUserNotificationsHandler } from './application/queries/get-user-notifications/get-user-notifications.handler';
import { GetUnreadCountHandler } from './application/queries/get-unread-count/get-unread-count.handler';
import { GetNotificationsAdminHandler } from './application/queries/get-notifications-admin/get-notifications-admin.handler';
import { GetUserSubscriptionsHandler } from './application/queries/get-user-subscriptions/get-user-subscriptions.handler';
import { GetResourceSubscribersHandler } from './application/queries/get-resource-subscribers/get-resource-subscribers.handler';

import { OnNotificationCreatedHandler } from './application/event-handlers/on-notification-created/on-notification-created.handler';
import { OnUserNotificationReadHandler } from './application/event-handlers/on-user-notification-read/on-user-notification-read.handler';
import { OnSubscriptionDeactivatedHandler } from './application/event-handlers/on-subscription-deactivated/on-subscription-deactivated.handler';
import { OnSubscriptionReactivatedHandler } from './application/event-handlers/on-subscription-reactivated/on-subscription-reactivated.handler';

import { GmailEmailAdapter } from './infrastructure/email/gmail-email.adapter';
import { SmtpEmailAdapter } from './infrastructure/email/smtp-email.adapter';
import { FallbackEmailAdapter } from './infrastructure/email/fallback-email.adapter';

import { OneSignalPushAdapter } from './infrastructure/push/onesignal-push.adapter';

import { CorrespondenceDispatchHandler } from './infrastructure/queue/correspondence-dispatch.handler';
import { PurgeNotificationsHandler } from './infrastructure/queue/purge-notifications.handler';
import { PurgeSubscriptionsHandler } from './infrastructure/queue/purge-subscriptions.handler';

import { UserNotificationController } from './presentation/controllers/user-notification.controller';
import { NotificationAdminController } from './presentation/controllers/notification-admin.controller';
import { SubscriptionController } from './presentation/controllers/subscription.controller';

export type Correspondence2ModuleOptions = z.infer<typeof Correspondence2OptionsSchema>;

export interface Correspondence2AsyncOptions
  extends DynamicModuleAsyncOptions<Correspondence2ModuleOptions> {}

export interface Correspondence2ModuleOverrides {
  /**
   * Host modules that export `IUserLookupPort` and/or `IUserRolePort`.
   * Both ports are @Optional — omit if user / role resolution is not needed.
   */
  imports?: ModuleMetadata['imports'];
  /** QueueModule dynamic module from the host (required for @QueueHandler processors). */
  queueModule?: DynamicModule;
}

const CorrespondenceRequiredPortsGuard = createRequiredPortsGuard('Correspondence2Module', [
  {
    token: TEMPLATE_PORT,
    fixHint:
      'Register { provide: TEMPLATE_PORT, useClass: JsonStoreTemplateAdapter } in IntegrationsModule.',
  },
  {
    token: DISPATCH_QUEUE_PORT,
    fixHint:
      'Register { provide: DISPATCH_QUEUE_PORT, useClass: QueueDispatchAdapter } in IntegrationsModule. Requires QueueModule.',
  },
]);

@Module({})
export class Correspondence2Module extends BaseDynamicModule {
  static forRoot(
    options: Correspondence2ModuleOptions,
    overrides: Correspondence2ModuleOverrides = {},
  ): DynamicModule {
    const validated = Correspondence2Module.validate(
      Correspondence2OptionsSchema,
      options,
    );
    const optionsProvider = Correspondence2Module.createOptionsProvider(
      CORRESPONDENCE2_OPTIONS,
      Correspondence2OptionsSchema,
      validated,
    );
    if (!overrides.queueModule) {
      throw new Error(
        '[Correspondence2Module] queueModule override is required. Pass QueueModule.forRoot/forRootAsync from the host.',
      );
    }
    return Correspondence2Module._build(
      [optionsProvider],
      overrides.queueModule,
      overrides.imports ?? [],
    );
  }

  static forRootAsync(
    options: Correspondence2AsyncOptions,
    overrides: Correspondence2ModuleOverrides = {},
  ): DynamicModule {
    const optionsProvider = Correspondence2Module.createAsyncOptionsProvider(
      CORRESPONDENCE2_OPTIONS,
      Correspondence2OptionsSchema,
      options,
    );
    if (!overrides.queueModule) {
      throw new Error(
        '[Correspondence2Module] queueModule override is required. Pass QueueModule.forRoot/forRootAsync from the host.',
      );
    }
    return Correspondence2Module._build(
      [optionsProvider],
      overrides.queueModule,
      options.imports ?? [],
    );
  }

  private static _build(
    optionsProviders: Provider[],
    queueModule: DynamicModule,
    extraImports: any[] = [],
  ): DynamicModule {
    return {
      module: Correspondence2Module,
      imports: [...extraImports, CqrsModule, queueModule],
      controllers: Correspondence2Module.controllers,
      providers: Correspondence2Module.providers(optionsProviders),
      exports: [],
    };
  }

  private static get controllers(): any[] {
    return [
      UserNotificationController,
      NotificationAdminController,
      SubscriptionController,
    ];
  }

  private static providers(optionsProviders: Provider[]): Provider[] {
    return [
      ...optionsProviders,
      CorrespondenceRequiredPortsGuard,

      GmailEmailAdapter,
      SmtpEmailAdapter,
      FallbackEmailAdapter,
      { provide: EMAIL_SENDER_PORT, useClass: FallbackEmailAdapter },

      { provide: PUSH_NOTIFICATION_PORT, useClass: OneSignalPushAdapter },

      CorrespondenceDispatchHandler,
      PurgeNotificationsHandler,
      PurgeSubscriptionsHandler,

      SubscriptionResolutionService,
      EmailDispatchService,
      { provide: IEmailDispatchPort, useClass: EmailDispatchService },
      RetentionSchedulerService,

      Correspondence2Orchestrator,

      MarkUserNotificationReadHandler,
      MarkAllUserNotificationsReadHandler,
      ArchiveUserNotificationHandler,
      SubscribeUserHandler,
      SubscribeRoleHandler,
      UnsubscribeUserHandler,
      UnsubscribeRoleHandler,
      UpdateChannelConfigHandler,
      UpdateSubscriberEmailHandler,
      ResendPushHandler,

      GetUserNotificationsHandler,
      GetUnreadCountHandler,
      GetNotificationsAdminHandler,
      GetUserSubscriptionsHandler,
      GetResourceSubscribersHandler,

      OnNotificationCreatedHandler,
      OnUserNotificationReadHandler,
      OnSubscriptionDeactivatedHandler,
      OnSubscriptionReactivatedHandler,
    ];
  }
}
