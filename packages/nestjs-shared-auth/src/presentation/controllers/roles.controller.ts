import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { ApiAutoPagedResponse, ApiAutoResponse, BaseFilter, PagedResponse, PaginatedQueryDto } from '@ce/nestjs-shared-core';
import { RoleFilter } from '../../domain/aggregates/role/role.aggregate';
import { ListRolesQuery } from '../../application/queries/list-roles/list-roles.query';
import { GetRoleQuery } from '../../application/queries/get-role/get-role.query';
import { RoleResponseDto } from '../../application/dtos/response/auth-response.dtos';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@ApiTags('Auth2 — Roles')
@Controller('auth/roles')
export class RolesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @RequirePermissions('read:roles')
  @ApiOperation({ summary: 'List all roles' })
  @ApiAutoPagedResponse(RoleResponseDto)
  listRoles(@Query() query: PaginatedQueryDto): Promise<PagedResponse<RoleResponseDto>> {
    return this.queryBus.execute(
      new ListRolesQuery(new BaseFilter<RoleFilter>(undefined, query.pageIndex, query.pageSize, query.sortBy, query.sortDir)),
    );
  }

  @Get(':key')
  @RequirePermissions('read:roles')
  @ApiOperation({ summary: 'Get role by key (includes permissions)' })
  @ApiAutoResponse(RoleResponseDto)
  getRole(@Param('key') key: string): Promise<RoleResponseDto> {
    return this.queryBus.execute(new GetRoleQuery(key));
  }
}
