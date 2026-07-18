import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@nabarun-ngo/nestjs-shared-auth';
import type { AuthUser } from '@nabarun-ngo/nestjs-shared-auth';

import { CreateUserCommand } from '../../application/commands/create-user/create-user.command';
import { UpdateUserProfileCommand } from '../../application/commands/update-user-profile/update-user-profile.command';
import { UpdateUserAdminCommand } from '../../application/commands/update-user-admin/update-user-admin.command';
import { InitiatePasswordChangeCommand } from '../../application/commands/initiate-password-change/initiate-password-change.command';
import { DeleteUserCommand } from '../../application/commands/delete-user/delete-user.command';
import { GrantUserConnectionCommand } from '../../application/commands/grant-user-connection/grant-user-connection.command';
import { RevokeUserConnectionCommand } from '../../application/commands/revoke-user-connection/revoke-user-connection.command';

import { GetMyProfileQuery } from '../../application/queries/get-my-profile/get-my-profile.query';
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id/get-user-by-id.query';
import { ListUsersQuery } from '../../application/queries/list-users/list-users.query';
import { GetUserReferenceDataQuery } from '../../application/queries/get-user-reference-data/get-user-reference-data.query';
import { GetUserConnectionsQuery } from '../../application/queries/get-user-connections/get-user-connections.query';

import { UserResponseDto, UserListResponseDto, UserRefDataResponseDto } from '../../application/dtos/user-response.dto';
import { LinkedConnectionDto, GrantConnectionResponseDto } from '../../application/dtos/user-connection.dto';

import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import { UpdateUserAdminDto } from '../dtos/update-user-admin.dto';
import { ListUsersQueryDto } from '../dtos/list-users.dto';
import { GrantConnectionDto } from '../dtos/grant-connection.dto';

/**
 * IMPORTANT: Static/parameterless routes (/profile/me, /static/referenceData,
 * /profile/init-password-change) are declared BEFORE /:id to avoid Express
 * treating the literal path segment as the `id` parameter.
 */
@ApiTags('Users')
@ApiBearerAuth('jwt')
@UseGuards(UnifiedAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  // ── Static routes (must be before /:id) ──────────────────────────────────

  @Get('profile/me')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  getMyProfile(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.queryBus.execute(new GetMyProfileQuery(user.idpSub));
  }

  @Put('profile/me')
  @ApiOperation({ summary: 'Update authenticated user profile' })
  updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserResponseDto> {
    const profileId = this.requireProfileId(user);
    return this.commandBus.execute(
      new UpdateUserProfileCommand({
        userId: profileId,
        detail: {
          title: dto.title,
          firstName: dto.firstName,
          middleName: dto.middleName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          about: dto.about,
          picture: dto.picture,
          isPublic: dto.isPublic,
          isSameAddress: dto.isSameAddress,
          primaryPhone: dto.primaryPhone,
          secondaryPhone: dto.secondaryPhone,
          presentAddress: dto.presentAddress,
          permanentAddress: dto.permanentAddress,
          socialMediaLinks: dto.socialMediaLinks,
        },
        requestorId: this.requireUserId(user),
      }),
    );
  }

  @Post('profile/init-password-change')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Initiate password change for authenticated user' })
  initiatePasswordChange(@CurrentUser() user: AuthUser): Promise<void> {
    const profileId = this.requireProfileId(user);
    return this.commandBus.execute(
      new InitiatePasswordChangeCommand({ userId: profileId, requestorId: this.requireUserId(user) }),
    );
  }

  @Get('static/referenceData')
  @ApiOperation({ summary: 'Get user reference data (titles, genders, countries, etc.)' })
  getReferenceData(
    @Query('countryCode') countryCode?: string,
    @Query('stateCode') stateCode?: string,
  ): Promise<UserRefDataResponseDto> {
    return this.queryBus.execute(new GetUserReferenceDataQuery(countryCode, stateCode));
  }

  // ── Collection routes ─────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('admin:users')
  @ApiOperation({ summary: 'Admin: create a new user (provisions Auth0 account)' })
  createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthUser,
  ): Promise<UserResponseDto> {
    return this.commandBus.execute(
      new CreateUserCommand({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        title: dto.title,
        middleName: dto.middleName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        about: dto.about,
        picture: dto.picture,
        isPublic: dto.isPublic,
        adminPassword: dto.adminPassword,
        createdById: this.requireUserId(user),
      }),
    );
  }

  @Get()
  @RequirePermissions('admin:users')
  @ApiOperation({ summary: 'Admin: list users with filters and pagination' })
  listUsers(@Query() query: ListUsersQueryDto): Promise<UserListResponseDto> {
    return this.queryBus.execute(
      new ListUsersQuery(
        {
          firstName: query.firstName,
          lastName: query.lastName,
          email: query.email,
          status: query.status,
          phoneNumber: query.phoneNumber,
          isPublic: query.isPublic,
        },
        query.pageIndex,
        query.pageSize,
        query.sortBy,
        query.sortDir,
      ),
    );
  }

  // ── Connection management (/:id/connections — before plain /:id) ──────────

  @Get(':id/connections')
  @RequirePermissions('admin:users')
  @ApiOperation({ summary: 'Admin: list all IdP identities linked to a user' })
  getUserConnections(@Param('id') id: string): Promise<LinkedConnectionDto[]> {
    return this.queryBus.execute(new GetUserConnectionsQuery(id));
  }

  @Post(':id/connections')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:users')
  @ApiOperation({
    summary: 'Admin: grant a new connection to a user',
    description:
      'Only `password` and `passwordless` connections can be granted. ' +
      'The identity is provisioned and linked immediately. ' +
      'Social and enterprise connections cannot be pre-provisioned and will throw an error.',
  })
  grantUserConnection(
    @Param('id') id: string,
    @Body() dto: GrantConnectionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<GrantConnectionResponseDto> {
    return this.commandBus.execute(
      new GrantUserConnectionCommand({ userId: id, connectionKey: dto.connectionKey, adminId: this.requireUserId(user) }),
    );
  }

  @Delete(':id/connections/:connectionKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('admin:users')
  @ApiOperation({
    summary: 'Admin: revoke (unlink) a secondary connection from a user',
    description: 'The primary (`default`) connection cannot be revoked.',
  })
  revokeUserConnection(
    @Param('id') id: string,
    @Param('connectionKey') connectionKey: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.commandBus.execute(
      new RevokeUserConnectionCommand({ userId: id, connectionKey, adminId: this.requireUserId(user) }),
    );
  }

  // ── Param routes (/:id — must be AFTER all static routes) ─────────────────

  @Get(':id')
  @RequirePermissions('admin:users')
  @ApiOperation({ summary: 'Admin: get user by id' })
  getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @Put(':id')
  @RequirePermissions('admin:users')
  @ApiOperation({ summary: 'Admin: update user attributes (status, PAN, login methods)' })
  updateUserAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() user: AuthUser,
  ): Promise<UserResponseDto> {
    return this.commandBus.execute(
      new UpdateUserAdminCommand({
        userId: id,
        detail: {
          status: dto.status,
          donationAmount: dto.donationAmount,
          donationPauseStart: dto.donationPauseStart,
          donationPauseEnd: dto.donationPauseEnd,
        },
        adminId: this.requireUserId(user),
      }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('admin:users')
  @ApiOperation({ summary: 'Admin: soft-delete user and remove from Auth0' })
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteUserCommand({ userId: id, adminId: this.requireUserId(user) }),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private requireProfileId(user: AuthUser): string {
    const enriched = user as AuthUser & { profileId?: string };
    if (!enriched.profileId) {
      throw new Error('profileId not available on enriched user — ensure UserModule is wired after AuthModule');
    }
    return enriched.profileId;
  }

  /**
   * Returns the app profile UUID of the acting user.
   * Throws if `userId` is not populated — which indicates a module wiring problem
   * (UserModule must be imported AFTER AuthModule so IUserLookupPort is resolved).
   *
   * NEVER use `user.idpSub` as an audit field — always call this helper instead.
   */
  private requireUserId(user: AuthUser): string {
    if (!user.userId) {
      throw new Error(
        'userId not available on AuthUser — ensure UserModule is imported AFTER AuthModule',
      );
    }
    return user.userId;
  }
}
