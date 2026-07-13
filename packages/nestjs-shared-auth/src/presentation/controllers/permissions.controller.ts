import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { ApiAutoPagedResponse, ApiAutoResponse, BaseFilter, PagedResponse, PaginatedQueryDto } from '@ce/nestjs-shared-core';
import { PermissionFilter } from '../../domain/aggregates/permission/permission.aggregate';
import { ListPermissionsQuery } from '../../application/queries/list-permissions/list-permissions.query';
import { GetPermissionQuery } from '../../application/queries/get-permission/get-permission.query';
import { PermissionResponseDto } from '../../application/dtos/response/auth-response.dtos';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@ApiTags('Auth2 — Permissions')
@Controller('auth/permissions')
export class PermissionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @RequirePermissions('read:permissions')
  @ApiOperation({ summary: 'List all permissions' })
  @ApiAutoPagedResponse(PermissionResponseDto)
  listPermissions(@Query() query: PaginatedQueryDto): Promise<PagedResponse<PermissionResponseDto>> {
    return this.queryBus.execute(
      new ListPermissionsQuery(new BaseFilter<PermissionFilter>(undefined, query.pageIndex, query.pageSize, query.sortBy, query.sortDir)),
    );
  }

  @Get(':key')
  @RequirePermissions('read:permissions')
  @ApiOperation({ summary: 'Get permission by key' })
  @ApiAutoResponse(PermissionResponseDto)
  getPermission(@Param('key') key: string): Promise<PermissionResponseDto> {
    return this.queryBus.execute(new GetPermissionQuery(key));
  }
}
