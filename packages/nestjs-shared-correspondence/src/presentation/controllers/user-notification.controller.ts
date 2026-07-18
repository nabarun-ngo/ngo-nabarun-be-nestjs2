import { Controller, Get, Patch, Param, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnifiedAuthGuard, CurrentUser, AuthUser } from '@nabarun-ngo/nestjs-shared-auth';
import { GetUserNotificationsQuery } from '../../application/queries/get-user-notifications/get-user-notifications.query';
import { GetUnreadCountQuery } from '../../application/queries/get-unread-count/get-unread-count.query';
import { MarkUserNotificationReadCommand } from '../../application/commands/mark-user-notification-read/mark-user-notification-read.command';
import { MarkAllUserNotificationsReadCommand } from '../../application/commands/mark-all-user-notifications-read/mark-all-user-notifications-read.command';
import { ArchiveUserNotificationCommand } from '../../application/commands/archive-user-notification/archive-user-notification.command';
import { ResendPushCommand } from '../../application/commands/resend-push/resend-push.command';
import { GetUserNotificationsRequestDto } from '../../application/dtos/notification.request.dto';

/**
 * Notification endpoints scoped to the currently authenticated user.
 * Uses user.userId (app profile UUID) — not user.idpSub.
 */
@ApiTags('correspondence / notifications')
@Controller('correspondence/notifications/me')
@UseGuards(UnifiedAuthGuard)
export class UserNotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  private requireProfileId(user: AuthUser): string {
    if (!user.userId) throw new UnauthorizedException('User profile not resolved');
    return user.userId;
  }

  @Get()
  @ApiOperation({ summary: 'List current user notifications (paged)' })
  async list(@Query() query: GetUserNotificationsRequestDto, @CurrentUser() user: AuthUser) {
    return this.queryBus.execute(
      new GetUserNotificationsQuery(
        this.requireProfileId(user),
        query.pageIndex,
        query.pageSize,
        query.isRead,
        query.isArchived,
      ),
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  async unreadCount(@CurrentUser() user: AuthUser) {
    return this.queryBus.execute(new GetUnreadCountQuery(this.requireProfileId(user)));
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  async markAllRead(@CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new MarkAllUserNotificationsReadCommand(this.requireProfileId(user)));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new MarkUserNotificationReadCommand(id, this.requireProfileId(user)));
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a single notification' })
  async archive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new ArchiveUserNotificationCommand(id, this.requireProfileId(user)));
  }

  @Patch(':id/resend-push')
  @ApiOperation({ summary: 'Retry push delivery for a notification' })
  async resendPush(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new ResendPushCommand(id, this.requireProfileId(user)));
  }
}
