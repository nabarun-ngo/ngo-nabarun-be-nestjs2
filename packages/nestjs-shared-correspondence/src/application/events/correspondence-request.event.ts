import { IEvent } from '@nestjs/cqrs';
import { NotificationCategory, NotificationPriority, NotificationType } from '../../domain/enums/notification-type.enum';
import type { NotificationAction } from '../../domain/aggregates/notification.aggregate';

// ── Recipient modes ────────────────────────────────────────────────────────

/** Dispatch to a set of explicit user IDs. */
export interface TargetUsersRecipients {
  mode: 'users';
  userIds: string[];
}

/** Dispatch to all users belonging to one or more roles. */
export interface TargetRolesRecipients {
  mode: 'roles';
  roleNames: string[];
}

/** Dispatch to all active resource subscribers. */
export interface TargetResourceRecipients {
  mode: 'resource';
  referenceType: string;
  referenceId?: string;
  /**
   * User IDs to suppress from the resolved subscriber list.
   * Use this to prevent duplicate notifications when certain users will
   * already receive a more specific notification (e.g. @mention alerts).
   */
  excludeUserIds?: string[];
}

export type Correspondence2Recipients =
  | TargetUsersRecipients
  | TargetRolesRecipients
  | TargetResourceRecipients;

// ── Channel options ────────────────────────────────────────────────────────

/**
 * In-app notification channel.
 * When present, a `Notification` record is persisted and appears in every
 * target user's in-app inbox. This is the only durable channel — if you
 * need a permanent record the user can revisit, specify this.
 *
 * Push notifications also read their title/body from this persisted record,
 * so `push` requires `inApp` to be set.
 */
export interface InAppChannelOptions {
  title: string;
  body: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  action?: NotificationAction;
  /** ID of the entity this notification relates to (used for deep-linking). */
  referenceId?: string;
  /** Type discriminator for `referenceId`. */
  referenceType?: string;
  imageUrl?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

/**
 * Email channel.
 * When present, an email is sent using the specified Handlebars template.
 * Can be used independently of `inApp` — no persistent record is required.
 */
export interface EmailChannelOptions {
  /** Template key in JsonStore `correspondence` namespace. */
  templateKey: string;
  /** Overrides subscription-resolved email addresses. */
  overrideEmails?: string[];
  /** CC addresses appended to subscription-resolved CC list. */
  cc?: string[];
  /** Handlebars variables merged with the template's defaultData. */
  templateData?: Record<string, unknown>;
}

/**
 * Push channel.
 * When present and `enabled`, a push notification is sent via OneSignal.
 * Title and body are read from the persisted `inApp` record, so `inApp`
 * must be set when using push.
 */
export interface PushChannelOptions {
  enabled: boolean;
}

/**
 * Valid channel combinations. Push requires inApp — the dispatch handler
 * fetches title/body/imageUrl/icon from the persisted notification row;
 * there is no content to send via OneSignal without that record.
 *
 * | inApp | email | push | Result                   |
 * |-------|-------|------|--------------------------|
 * | ✓     |       |      | In-app inbox only        |
 * |       | ✓     |      | Email only               |
 * | ✓     | ✓     |      | In-app + email           |
 * | ✓     |       | ✓    | In-app + push            |
 * | ✓     | ✓     | ✓    | All three                |
 */
export type CorrespondenceChannels =
  | { inApp: InAppChannelOptions; email?: EmailChannelOptions; push?: PushChannelOptions }
  | { inApp?: never; email: EmailChannelOptions; push?: never };

// ── Request event ──────────────────────────────────────────────────────────

/**
 * Public integration event published by consumer modules to trigger a
 * correspondence dispatch.
 *
 * The payload has two top-level fields:
 *  - `recipients` — who receives it (users / roles / resource subscribers)
 *  - `channels`   — what to send: `inApp` (persistent record), `email`, `push`
 *
 * All three channels are optional — specify only the ones you need.
 *
 * @example In-app + email + push
 * this.eventBus.publish(new CorrespondenceRequestEvent({
 *   recipients: { mode: 'users', userIds: ['user-1'] },
 *   channels: {
 *     inApp: {
 *       title: 'Task assigned',
 *       body: 'You have been assigned a new task.',
 *       type: NotificationType.TASK,
 *       category: NotificationCategory.WORKFLOW,
 *       referenceId: 'task-123',
 *       referenceType: 'task',
 *     },
 *     email: { templateKey: 'task-assigned', templateData: { taskTitle: 'Review PR' } },
 *     push:  { enabled: true },
 *   },
 * }));
 *
 * @example Email only (no persistent record)
 * this.eventBus.publish(new CorrespondenceRequestEvent({
 *   recipients: { mode: 'resource', referenceType: 'project', referenceId: 'proj-1' },
 *   channels: {
 *     email: { templateKey: 'weekly-summary', templateData: { ... } },
 *   },
 * }));
 */
export class CorrespondenceRequestEvent implements IEvent {
  readonly recipients: Correspondence2Recipients;
  readonly channels: CorrespondenceChannels;

  constructor(params: {
    recipients: Correspondence2Recipients;
    channels: CorrespondenceChannels;
  }) {
    this.recipients = params.recipients;
    this.channels = params.channels;
  }
}
