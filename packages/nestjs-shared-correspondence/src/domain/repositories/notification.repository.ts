import { IRepository } from '@ce/nestjs-shared-core';
import { Notification, NotificationFilter } from '../aggregates/notification.aggregate';
import { UserNotification } from '../aggregates/user-notification.aggregate';

export interface INotificationRepository
  extends IRepository<Notification, string, NotificationFilter> {
  /**
   * Atomically creates a Notification and its associated UserNotifications
   * in a single transaction. Returns the created Notification.
   */
  createWithUserNotifications(
    notification: Notification,
    userNotifications: UserNotification[],
  ): Promise<Notification>;

  /** Bulk-update push status for a list of UserNotification IDs */
  bulkMarkPushSent(
    userNotificationIds: string[],
    success: boolean,
    error?: string,
  ): Promise<void>;

  /** Delete notifications older than the given date */
  deleteExpiredBefore(date: Date): Promise<number>;
}

export const INotificationRepository = Symbol('INotificationRepository');
