import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, UnifiedAuthGuard } from '@nabarun-ngo/nestjs-shared-auth';
import { APP_LINK_PLATFORMS } from '../../links.schema';
import { GetUserGuidesQuery } from '../../application/queries/get-user-guides/get-user-guides.query';
import { GetPoliciesQuery } from '../../application/queries/get-policies/get-policies.query';
import { GetAppLinksQuery } from '../../application/queries/get-app-links/get-app-links.query';
import { LinkGroupDto, LinkItemDto } from '../../application/dtos/links.dto';

@ApiTags('Links')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('links')
export class LinksController {
  constructor(private readonly queryBus: QueryBus) { }

  @Get('user-guides')
  @RequirePermissions('read:links')
  @ApiOperation({ summary: 'Get user guide links grouped by category' })
  getUserGuides(): Promise<LinkGroupDto[]> {
    return this.queryBus.execute(new GetUserGuidesQuery());
  }

  @Get('policies')
  @RequirePermissions('read:links')
  @ApiOperation({ summary: 'Get policy links grouped by category' })
  getPolicies(): Promise<LinkGroupDto[]> {
    return this.queryBus.execute(new GetPoliciesQuery());
  }

  @Get('app-links')
  @RequirePermissions('read:links')
  @ApiOperation({ summary: 'Get app / external links' })
  @ApiQuery({
    name: 'platform',
    required: true,
    description: 'Platform or link category',
    enum: APP_LINK_PLATFORMS,
  })
  getAppLinks(@Query('platform') platform: string): Promise<LinkItemDto[]> {
    return this.queryBus.execute(new GetAppLinksQuery(platform));
  }
}
