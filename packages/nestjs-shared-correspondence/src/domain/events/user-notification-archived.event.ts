import { DomainEvent } from '@ce/nestjs-shared-core';
import type { UserNotification } from '../aggregates/user-notification.aggregate';

export type UserNotificationArchivedSnapshot = Pick<UserNotification, 'id' | 'notificationId' | 'userId'>;

export class UserNotificationArchivedEvent extends DomainEvent<UserNotificationArchivedSnapshot> {
  constructor(snapshot: UserNotificationArchivedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
