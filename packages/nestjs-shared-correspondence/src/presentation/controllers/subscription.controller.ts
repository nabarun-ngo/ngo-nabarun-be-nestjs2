import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnifiedAuthGuard, CurrentUser, AuthUser } from '@ce/nestjs-shared-auth';
import { SubscribeUserCommand } from '../../application/commands/subscribe-user/subscribe-user.command';
import { UnsubscribeUserCommand } from '../../application/commands/unsubscribe-user/unsubscribe-user.command';
import { UpdateChannelConfigCommand } from '../../application/commands/update-channel-config/update-channel-config.command';
import { GetUserSubscriptionsQuery } from '../../application/queries/get-user-subscriptions/get-user-subscriptions.query';
import { GetResourceSubscribersQuery } from '../../application/queries/get-resource-subscribers/get-resource-subscribers.query';
import { SubscribeUserRequestDto, UpdateChannelConfigRequestDto } from '../../application/dtos/subscription.request.dto';

@ApiTags('correspondence / subscriptions')
@Controller('correspondence/subscriptions')
@UseGuards(UnifiedAuthGuard)
export class SubscriptionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  private requireProfileId(user: AuthUser): string {
    if (!user.userId) throw new UnauthorizedException('User profile not resolved');
    return user.userId;
  }

  @Get('me')
  @ApiOperation({ summary: 'List subscriptions for the current user' })
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.queryBus.execute(new GetUserSubscriptionsQuery(this.requireProfileId(user), resourceType, resourceId));
  }

  @Post()
  @ApiOperation({ summary: 'Subscribe current user to a resource' })
  async subscribe(@Body() body: SubscribeUserRequestDto, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(
      new SubscribeUserCommand(
        this.requireProfileId(user),
        user.email || undefined,
        body.resourceType,
        body.via,
        undefined,
        body.resourceId,
        body.channels,
      ),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Unsubscribe current user from a resource' })
  async unsubscribe(@Param('id') subscriptionId: string, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(
      new UnsubscribeUserCommand(this.requireProfileId(user), undefined, undefined, subscriptionId),
    );
  }

  @Patch(':id/channels')
  @ApiOperation({ summary: 'Update channel config for a subscription' })
  async updateChannel(
    @Param('id') subscriptionId: string,
    @Body() body: UpdateChannelConfigRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commandBus.execute(
      new UpdateChannelConfigCommand(
        subscriptionId,
        this.requireProfileId(user),
        body.channel,
        body.enabled,
        body.emailRole,
      ),
    );
  }

  @Get('resource')
  @ApiOperation({ summary: 'List all subscribers for a resource (admin)' })
  async getResourceSubscribers(
    @Query('resourceType') resourceType: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.queryBus.execute(new GetResourceSubscribersQuery(resourceType, resourceId));
  }
}
