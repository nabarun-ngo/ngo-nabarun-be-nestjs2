import { NotificationType, NotificationCategory } from '../../../domain/enums/notification-type.enum';

export class GetNotificationsAdminQuery {
  constructor(
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
    public readonly type?: NotificationType,
    public readonly category?: NotificationCategory,
    public readonly referenceId?: string,
    public readonly referenceType?: string,
    public readonly fromDate?: Date,
    public readonly toDate?: Date,
  ) {}
}
