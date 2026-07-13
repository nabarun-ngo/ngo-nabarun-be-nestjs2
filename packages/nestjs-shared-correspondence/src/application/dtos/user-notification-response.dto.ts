import { NotificationResponseDto } from './notification-response.dto';

export class UserNotificationResponseDto {
  id: string;
  notificationId: string;
  userId: string;
  isRead: boolean;
  readAt?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  isPushSent: boolean;
  pushDelivered: boolean;
  createdAt: Date;
  updatedAt: Date;
  notification?: NotificationResponseDto;
}
