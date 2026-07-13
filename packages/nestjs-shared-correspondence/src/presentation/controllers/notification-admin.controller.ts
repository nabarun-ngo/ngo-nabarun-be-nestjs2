import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnifiedAuthGuard, PermissionsGuard, RequirePermissions } from '@ce/nestjs-shared-auth';
import { GetNotificationsAdminQuery } from '../../application/queries/get-notifications-admin/get-notifications-admin.query';
import { GetAdminNotificationsRequestDto } from '../../application/dtos/notification.request.dto';

@ApiTags('correspondence / admin')
@Controller('correspondence/admin/notifications')
@UseGuards(UnifiedAuthGuard, PermissionsGuard)
export class NotificationAdminController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List all notifications (admin)' })
  @RequirePermissions('read:notifications')
  async list(@Query() query: GetAdminNotificationsRequestDto) {
    return this.queryBus.execute(
      new GetNotificationsAdminQuery(
        query.pageIndex,
        query.pageSize,
        undefined,
        undefined,
        query.referenceId,
        query.referenceType,
      ),
    );
  }
}
