import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';
import type { Notification } from '../aggregates/notification.aggregate';

export type NotificationCreatedSnapshot = Pick<Notification, 'id' | 'title' | 'body' | 'type' | 'category' | 'referenceId' | 'referenceType'>;

export class NotificationCreatedEvent extends DomainEvent<NotificationCreatedSnapshot> {
  constructor(snapshot: NotificationCreatedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
