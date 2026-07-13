import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiAutoResponse } from '@ce/nestjs-shared-core';
import { GrantUserRoleCommand } from '../../application/commands/grant-user-role/grant-user-role.command';
import { RevokeUserRoleCommand } from '../../application/commands/revoke-user-role/revoke-user-role.command';
import { AddUserToGroupCommand } from '../../application/commands/add-user-to-group/add-user-to-group.command';
import { RemoveUserFromGroupCommand } from '../../application/commands/remove-user-from-group/remove-user-from-group.command';
import { ListUserRolesQuery } from '../../application/queries/list-user-roles/list-user-roles.query';
import { ListUserGroupsQuery } from '../../application/queries/list-user-groups/list-user-groups.query';
import { ResolveUserAccessQuery } from '../../application/queries/resolve-user-access/resolve-user-access.query';
import { GrantRoleRequestDto, AddToGroupRequestDto } from '../../application/dtos/request/auth-request.dtos';
import {
  RbacResponseDto,
  UserRoleGroupResponseDto,
  UserRoleResponseDto,
} from '../../application/dtos/response/auth-response.dtos';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuthUser } from '../../application/models/auth-user';

@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@ApiTags('Auth2 — User Roles')
@Controller('auth/rbac/users/:idpSub')
export class UserRolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** Returns the best available caller ID for audit fields: prefers app userId over raw IdP sub. */
  private auditId(caller: AuthUser): string {
    return caller.userId ?? caller.idpSub;
  }

  @Get('roles')
  @RequirePermissions('read:user_roles')
  @ApiOperation({ summary: 'List active roles for a user' })
  @ApiAutoResponse(UserRoleResponseDto, { isArray: true })
  listUserRoles(
    @Param('idpSub') idpSub: string,
    @Query('all') all?: string,
  ): Promise<UserRoleResponseDto[]> {
    return this.queryBus.execute(new ListUserRolesQuery(idpSub, all !== 'true'));
  }

  @Post('roles')
  @RequirePermissions('create:user_roles')
  @ApiOperation({ summary: 'Grant a role to a user' })
  @ApiBody({ type: GrantRoleRequestDto })
  @ApiAutoResponse(UserRoleResponseDto, { status: 201 })
  grantRole(
    @Param('idpSub') idpSub: string,
    @Body() dto: GrantRoleRequestDto,
    @CurrentUser() caller: AuthUser,
  ): Promise<UserRoleResponseDto> {
    return this.commandBus.execute(
      new GrantUserRoleCommand(idpSub, dto.roleKey, dto.ownerId, this.auditId(caller), dto.note, dto.entityId, dto.entityType),
    );
  }

  @Delete('roles/:roleId')
  @RequirePermissions('delete:user_roles')
  @ApiOperation({ summary: 'Revoke a role from a user' })
  @ApiAutoResponse(UserRoleResponseDto)
  revokeRole(
    @Param('idpSub') idpSub: string,
    @Param('roleId') roleId: string,
    @CurrentUser() caller: AuthUser,
  ): Promise<UserRoleResponseDto> {
    return this.commandBus.execute(new RevokeUserRoleCommand(idpSub, roleId, this.auditId(caller)));
  }

  @Get('groups')
  @RequirePermissions('read:user_roles')
  @ApiOperation({ summary: 'List group memberships for a user' })
  @ApiAutoResponse(UserRoleGroupResponseDto, { isArray: true })
  listUserGroups(
    @Param('idpSub') idpSub: string,
    @Query('all') all?: string,
  ): Promise<UserRoleGroupResponseDto[]> {
    return this.queryBus.execute(new ListUserGroupsQuery(idpSub, all !== 'true'));
  }

  @Post('groups')
  @RequirePermissions('create:user_roles')
  @ApiOperation({ summary: 'Add a user to a role group' })
  @ApiBody({ type: AddToGroupRequestDto })
  @ApiAutoResponse(UserRoleGroupResponseDto, { status: 201 })
  addToGroup(
    @Param('idpSub') idpSub: string,
    @Body() dto: AddToGroupRequestDto,
    @CurrentUser() caller: AuthUser,
  ): Promise<UserRoleGroupResponseDto> {
    return this.commandBus.execute(
      new AddUserToGroupCommand(idpSub, dto.groupKey, dto.ownerId, this.auditId(caller), dto.note, dto.entityId, dto.entityType),
    );
  }

  @Delete('groups/:membershipId')
  @RequirePermissions('delete:user_roles')
  @ApiOperation({ summary: 'Remove a user from a role group' })
  @ApiAutoResponse(UserRoleGroupResponseDto)
  removeFromGroup(
    @Param('idpSub') idpSub: string,
    @Param('membershipId') membershipId: string,
    @CurrentUser() caller: AuthUser,
  ): Promise<UserRoleGroupResponseDto> {
    return this.commandBus.execute(
      new RemoveUserFromGroupCommand(idpSub, membershipId, this.auditId(caller)),
    );
  }

  @Get('permissions')
  @RequirePermissions('read:user_roles')
  @ApiOperation({ summary: 'Resolve full RBAC access for a user' })
  @ApiAutoResponse(RbacResponseDto)
  resolveAccess(@Param('idpSub') idpSub: string): Promise<RbacResponseDto> {
    return this.queryBus.execute(new ResolveUserAccessQuery(idpSub));
  }
}
