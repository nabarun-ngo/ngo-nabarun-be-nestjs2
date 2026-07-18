// ── Module registration ────────────────────────────────────────────────────
export { Correspondence2Module as CorrespondenceModule } from './correspondence.module';
export type {
  Correspondence2ModuleOptions as CorrespondenceModuleOptions,
  Correspondence2AsyncOptions as CorrespondenceAsyncOptions,
  Correspondence2ModuleOverrides as CorrespondenceModuleOverrides,
} from './correspondence.module';
export { CORRESPONDENCE2_OPTIONS as CORRESPONDENCE_OPTIONS } from './correspondence-options.token';

// ── Public integration event (re-exported from core for backward compatibility) ──
export {
  CorrespondenceRequestEvent,
  type CorrespondenceRecipients as CorrespondenceRecipients,
  type TargetUsersRecipients,
  type TargetRolesRecipients,
  type TargetResourceRecipients,
  type InAppChannelOptions,
  type EmailChannelOptions,
  type PushChannelOptions,
  type CorrespondenceChannels,
} from '@nabarun-ngo/nestjs-shared-core';
export type { CorrespondenceRecipients as Correspondence2Recipients } from '@nabarun-ngo/nestjs-shared-core';

// ── Domain enums (needed by consumers when building events) ───────────────
export { ChannelType } from './domain/enums/channel-type.enum';
export { EmailRole } from './domain/enums/email-role.enum';
export { SubscriberType } from './domain/enums/subscriber-type.enum';
export { SubscribedVia } from './domain/enums/subscribed-via.enum';
export {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '@nabarun-ngo/nestjs-shared-core';

// ── Domain errors (consumers may catch these) ─────────────────────────────
export {
  NotificationNotFoundError,
  UserNotificationNotFoundError,
  SubscriptionNotFoundError,
  TemplateNotFoundError,
  NotificationAlreadyReadError,
  NotificationAlreadyArchivedError,
  TokenNotAvailableError,
  EmailDeliveryFailedError,
} from './domain/errors/correspondence.errors';

// ── Application commands (consumers may dispatch directly) ─────────────────
export { SubscribeUserCommand } from './application/commands/subscribe-user/subscribe-user.command';
export type { SubscribeChannelInput } from './application/commands/subscribe-user/subscribe-user.command';
export { SubscribeRoleCommand } from './application/commands/subscribe-role/subscribe-role.command';
export { UnsubscribeUserCommand } from './application/commands/unsubscribe-user/unsubscribe-user.command';
export { UnsubscribeRoleCommand } from './application/commands/unsubscribe-role/unsubscribe-role.command';
export { UpdateSubscriberEmailCommand } from './application/commands/update-subscriber-email/update-subscriber-email.command';

// ── Application queries (consumers may dispatch directly) ──────────────────
export { GetUserNotificationsQuery } from './application/queries/get-user-notifications/get-user-notifications.query';
export { GetUnreadCountQuery } from './application/queries/get-unread-count/get-unread-count.query';
export { GetUserSubscriptionsQuery } from './application/queries/get-user-subscriptions/get-user-subscriptions.query';
export { GetResourceSubscribersQuery } from './application/queries/get-resource-subscribers/get-resource-subscribers.query';

// ── Application DTOs ──────────────────────────────────────────────────────
export { NotificationResponseDto } from './application/dtos/notification-response.dto';
export { UserNotificationResponseDto } from './application/dtos/user-notification-response.dto';
export { SubscriptionResponseDto, SubscriptionChannelDto } from './application/dtos/subscription-response.dto';

// ── Application ports ─────────────────────────────────────────────────────
export { IEmailDispatchPort } from './application/ports/email-dispatch.port';
export type { EmailDispatchInput } from './application/ports/email-dispatch.port';

// ── Job classes (consumers may also dispatch directly for testing) ─────────
export { CorrespondenceDispatchJob } from './application/jobs/correspondence-dispatch.job';
export { PurgeNotificationsJob, PurgeSubscriptionsJob } from './application/jobs/retention.jobs';

// ── Domain repository tokens (for testing / custom implementations) ────────
export { INotificationRepository } from './domain/repositories/notification.repository';
export { IUserNotificationRepository } from './domain/repositories/user-notification.repository';
export { IResourceSubscriptionRepository } from './domain/repositories/resource-subscription.repository';

// ── Domain port tokens ────────────────────────────────────────────────────
export { EMAIL_SENDER_PORT } from './domain/ports/email-sender.port';
export { PUSH_NOTIFICATION_PORT } from './domain/ports/push-notification.port';
export { DISPATCH_QUEUE_PORT } from './domain/ports/dispatch-queue.port';
export { TEMPLATE_PORT } from './domain/ports/template.port';
export type { IEmailSenderPort, EmailMessage } from './domain/ports/email-sender.port';
export type { IPushNotificationPort, PushNotificationPayload } from './domain/ports/push-notification.port';
export type { IDispatchQueuePort, CorrespondenceDispatchPayload } from './domain/ports/dispatch-queue.port';
export type { ITemplatePort, EmailTemplateData } from './domain/ports/template.port';

// ── JSON-store payload schemas ───────────────────────────────────────────────
export {
  EmailTemplatePayloadSchema,
  type EmailTemplatePayload,
} from './email-template.schema';
