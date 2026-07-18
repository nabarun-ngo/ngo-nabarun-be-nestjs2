import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { ApiAutoPagedResponse, ApiAutoResponse, BaseFilter, PagedResponse, PaginatedQueryDto } from '@nabarun-ngo/nestjs-shared-core';
import { RoleGroupFilter } from '../../domain/aggregates/role-group/role-group.aggregate';
import { ListRoleGroupsQuery } from '../../application/queries/list-role-groups/list-role-groups.query';
import { GetRoleGroupQuery } from '../../application/queries/get-role-group/get-role-group.query';
import { RoleGroupResponseDto } from '../../application/dtos/response/role-group-response.dto';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@ApiTags('Auth2 — Role Groups')
@Controller('auth/role-groups')
export class RoleGroupsController {
  constructor(private readonly queryBus: QueryBus) { }

  @Get()
  @RequirePermissions('read:role_groups')
  @ApiOperation({ summary: 'List all role groups' })
  @ApiAutoPagedResponse(RoleGroupResponseDto)
  listRoleGroups(@Query() query: PaginatedQueryDto): Promise<PagedResponse<RoleGroupResponseDto>> {
    return this.queryBus.execute(
      new ListRoleGroupsQuery(new BaseFilter<RoleGroupFilter>(undefined, query.pageIndex, query.pageSize, query.sortBy, query.sortDir)),
    );
  }

  @Get(':key')
  @RequirePermissions('read:role_groups')
  @ApiOperation({ summary: 'Get role group by key' })
  @ApiAutoResponse(RoleGroupResponseDto)
  getRoleGroup(@Param('key') key: string): Promise<RoleGroupResponseDto> {
    return this.queryBus.execute(new GetRoleGroupQuery(key));
  }
}
