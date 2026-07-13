import { NotificationCategory, NotificationPriority, NotificationType } from '../../domain/enums/notification-type.enum';
import type { NotificationAction } from '../../domain/aggregates/notification.aggregate';

export class NotificationResponseDto {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  action?: NotificationAction;
  referenceId?: string;
  referenceType?: string;
  imageUrl?: string;
  icon?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
