import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserNotificationsQuery } from './get-user-notifications.query';
import { IUserNotificationRepository } from '../../../domain/repositories/user-notification.repository';
import { INotificationRepository } from '../../../domain/repositories/notification.repository';
import { NotificationMapper } from '../../mappers/notification.mapper';
import { UserNotificationResponseDto } from '../../dtos/user-notification-response.dto';
import { Page } from '@nabarun-ngo/nestjs-shared-core';

@QueryHandler(GetUserNotificationsQuery)
export class GetUserNotificationsHandler
  implements IQueryHandler<GetUserNotificationsQuery, Page<UserNotificationResponseDto>> {
  constructor(
    @Inject(IUserNotificationRepository)
    private readonly userNotificationRepo: IUserNotificationRepository,
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
  ) { }

  async execute(query: GetUserNotificationsQuery): Promise<Page<UserNotificationResponseDto>> {
    const page = await this.userNotificationRepo.findPaged({
      pageIndex: query.pageIndex,
      pageSize: query.pageSize,
      props: {
        userId: query.userId,
        isRead: query.isRead,
        isArchived: query.isArchived,
      },
    });

    const dtos = await Promise.all(
      page.content.map(async (un) => {
        const notification = await this.notificationRepo.findById(un.notificationId);
        return NotificationMapper.toUserNotificationDto(un, notification ?? undefined);
      }),
    );

    return new Page(dtos, page.totalSize, page.pageIndex, page.pageSize);
  }
}
