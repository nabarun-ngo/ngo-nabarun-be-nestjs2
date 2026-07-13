import { DomainEvent } from '@ce/nestjs-shared-core';
import type { UserNotification } from '../aggregates/user-notification.aggregate';

export type UserNotificationReadSnapshot = Pick<UserNotification, 'id' | 'notificationId' | 'userId'>;

export class UserNotificationReadEvent extends DomainEvent<UserNotificationReadSnapshot> {
  constructor(snapshot: UserNotificationReadSnapshot) {
    super(snapshot.id, snapshot);
  }
}
