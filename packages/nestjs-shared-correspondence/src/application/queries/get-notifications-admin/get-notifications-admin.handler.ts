import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetNotificationsAdminQuery } from './get-notifications-admin.query';
import { INotificationRepository } from '../../../domain/repositories/notification.repository';
import { NotificationMapper } from '../../mappers/notification.mapper';
import { NotificationResponseDto } from '../../dtos/notification-response.dto';
import { Page } from '@ce/nestjs-shared-core';

@QueryHandler(GetNotificationsAdminQuery)
export class GetNotificationsAdminHandler
  implements IQueryHandler<GetNotificationsAdminQuery, Page<NotificationResponseDto>>
{
  constructor(
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(query: GetNotificationsAdminQuery): Promise<Page<NotificationResponseDto>> {
    const page = await this.notificationRepo.findPaged({
      pageIndex: query.pageIndex,
      pageSize: query.pageSize,
      props: {
        type: query.type,
        category: query.category,
        referenceId: query.referenceId,
        referenceType: query.referenceType,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
    });
    const dtos = page.content.map((n) => NotificationMapper.toDto(n));
    return new Page(dtos, page.totalSize, page.pageIndex, page.pageSize);
  }
}
