import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { DiscoveryModule } from '@nestjs/core';
import { BaseDynamicModule, DynamicModuleAsyncOptions } from '@ce/nestjs-shared-core';

import { Auth2ModuleOptions } from './auth-options';
import { Auth2OptionsSchema } from './auth.schema';
import { AUTH2_OPTIONS } from './infrastructure/auth-options.token';

import { IApiKeyRepository } from './domain/repositories/api-key.repository';
import { IRoleRepository } from './domain/repositories/role.repository';
import { IPermissionRepository } from './domain/repositories/permission.repository';
import { IRoleGroupRepository } from './domain/repositories/role-group.repository';
import { IUserRoleRepository } from './domain/repositories/user-role.repository';
import { IUserRoleGroupRepository } from './domain/repositories/user-role-group.repository';

import { IJwtVerifierPort } from './application/ports/jwt-verifier.port';
import { IApiKeyVerifierPort } from './application/ports/api-key-verifier.port';
import { IRecaptchaPort } from './application/ports/recaptcha.port';
import { IUserAccessPort } from './application/ports/user-access.port';

import { JwtVerifierAdapter } from './infrastructure/adapters/jwt-verifier.adapter';
import { ApiKeyVerifierAdapter } from './infrastructure/adapters/api-key-verifier.adapter';
import { RecaptchaAdapter } from './infrastructure/adapters/recaptcha.adapter';
import { UserAccessAdapter } from './infrastructure/adapters/user-access.adapter';
import { UserRoleAdapter } from './infrastructure/adapters/user-role.adapter';

import { IUserRolePort } from './domain/ports/user-role.port';
import { AuthFacade } from './application/services/auth.facade';

import { GenerateApiKeyHandler } from './application/commands/generate-api-key/generate-api-key.handler';
import { MarkApiKeyUsedHandler } from './application/commands/mark-api-key-used/mark-api-key-used.handler';
import { RevokeApiKeyHandler } from './application/commands/revoke-api-key/revoke-api-key.handler';
import { UpdateApiKeyPermissionsHandler } from './application/commands/update-api-key-permissions/update-api-key-permissions.handler';
import { GrantUserRoleHandler } from './application/commands/grant-user-role/grant-user-role.handler';
import { RevokeUserRoleHandler } from './application/commands/revoke-user-role/revoke-user-role.handler';
import { AddUserToGroupHandler } from './application/commands/add-user-to-group/add-user-to-group.handler';
import { RemoveUserFromGroupHandler } from './application/commands/remove-user-from-group/remove-user-from-group.handler';

import { ListApiKeysHandler } from './application/queries/list-api-keys/list-api-keys.handler';
import { ListApiScopesHandler } from './application/queries/list-api-scopes/list-api-scopes.handler';
import { ListRolesHandler } from './application/queries/list-roles/list-roles.handler';
import { GetRoleHandler } from './application/queries/get-role/get-role.handler';
import { ListPermissionsHandler } from './application/queries/list-permissions/list-permissions.handler';
import { GetPermissionHandler } from './application/queries/get-permission/get-permission.handler';
import { ListRoleGroupsHandler } from './application/queries/list-role-groups/list-role-groups.handler';
import { GetRoleGroupHandler } from './application/queries/get-role-group/get-role-group.handler';
import { ListUserRolesHandler } from './application/queries/list-user-roles/list-user-roles.handler';
import { ListUserGroupsHandler } from './application/queries/list-user-groups/list-user-groups.handler';
import { ResolveUserAccessHandler } from './application/queries/resolve-user-access/resolve-user-access.handler';

import { OnApiKeyUsedHandler } from './application/event-handlers/on-api-key-used/on-api-key-used.handler';
import { OnApiKeyRevokedHandler } from './application/event-handlers/on-api-key-revoked/on-api-key-revoked.handler';
import { OnApiKeyPermissionsUpdatedHandler } from './application/event-handlers/on-api-key-permissions-updated/on-api-key-permissions-updated.handler';
import { OnUserRoleGrantedHandler } from './application/event-handlers/on-user-role-granted/on-user-role-granted.handler';
import { OnUserRoleRevokedHandler } from './application/event-handlers/on-user-role-revoked/on-user-role-revoked.handler';
import { OnUserRoleGroupGrantedHandler } from './application/event-handlers/on-user-role-group-granted/on-user-role-group-granted.handler';
import { OnUserRoleGroupRevokedHandler } from './application/event-handlers/on-user-role-group-revoked/on-user-role-group-revoked.handler';

import { UnifiedAuthGuard } from './presentation/guards/unified-auth.guard';
import { AppThrottlerGuard } from './presentation/guards/app-throttler.guard';
import { PermissionsGuard } from './presentation/guards/permissions.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { RoleGroupsGuard } from './presentation/guards/role-groups.guard';
import { ScopedPermissionsGuard } from './presentation/guards/scoped-permissions.guard';

import { ApiKeyController } from './presentation/controllers/api-key.controller';
import { MeController } from './presentation/controllers/me.controller';
import { RolesController } from './presentation/controllers/roles.controller';
import { PermissionsController } from './presentation/controllers/permissions.controller';
import { RoleGroupsController } from './presentation/controllers/role-groups.controller';
import { UserRolesController } from './presentation/controllers/user-roles.controller';

export interface Auth2ModuleAsyncOptions
  extends DynamicModuleAsyncOptions<Auth2ModuleOptions> {}

const COMMAND_HANDLERS = [
  GenerateApiKeyHandler,
  MarkApiKeyUsedHandler,
  RevokeApiKeyHandler,
  UpdateApiKeyPermissionsHandler,
  GrantUserRoleHandler,
  RevokeUserRoleHandler,
  AddUserToGroupHandler,
  RemoveUserFromGroupHandler,
];

const QUERY_HANDLERS = [
  ListApiKeysHandler,
  ListApiScopesHandler,
  ListRolesHandler,
  GetRoleHandler,
  ListPermissionsHandler,
  GetPermissionHandler,
  ListUserRolesHandler,
  ListUserGroupsHandler,
  ResolveUserAccessHandler,
  ListRoleGroupsHandler,
  GetRoleGroupHandler,
];

const EVENT_HANDLERS = [
  OnApiKeyUsedHandler,
  OnApiKeyRevokedHandler,
  OnApiKeyPermissionsUpdatedHandler,
  OnUserRoleGrantedHandler,
  OnUserRoleRevokedHandler,
  OnUserRoleGroupGrantedHandler,
  OnUserRoleGroupRevokedHandler,
];

@Module({})
export class Auth2Module extends BaseDynamicModule {
  static forRoot(options: Auth2ModuleOptions): DynamicModule {
    return Auth2Module._build([
      Auth2Module.createOptionsProvider(AUTH2_OPTIONS, Auth2OptionsSchema, options),
    ]);
  }

  static forRootAsync(options: Auth2ModuleAsyncOptions): DynamicModule {
    return Auth2Module._build(
      [
        Auth2Module.createAsyncOptionsProvider(
          AUTH2_OPTIONS,
          Auth2OptionsSchema,
          options,
        ),
      ],
      options.imports,
    );
  }

  private static _build(
    optionsProviders: Provider[],
    extraImports: any[] = [],
  ): DynamicModule {
    return {
      module: Auth2Module,
      global: true,
      imports: [
        ...extraImports,
        ThrottlerModule.forRoot({
          throttlers: [
            { name: 'default', ttl: 60_000, limit: 30 },
            { name: 'publicGet', ttl: 60_000, limit: 60 },
            { name: 'publicFormPost', ttl: 60_000, limit: 10 },
            { name: 'newsletter', ttl: 3_600_000, limit: 3 },
            { name: 'publicPostGlobal', ttl: 3_600_000, limit: 100 },
          ],
        }),
        CqrsModule,
        HttpModule,
        DiscoveryModule,
      ],
      controllers: [
        ApiKeyController,
        MeController,
        RolesController,
        PermissionsController,
        RoleGroupsController,
        UserRolesController,
      ],
      providers: [
        ...optionsProviders,

        { provide: APP_GUARD, useClass: AppThrottlerGuard },
        { provide: APP_GUARD, useClass: UnifiedAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_GUARD, useClass: RoleGroupsGuard },
        { provide: APP_GUARD, useClass: ScopedPermissionsGuard },

        { provide: IUserAccessPort,      useClass: UserAccessAdapter },
        { provide: IJwtVerifierPort,     useClass: JwtVerifierAdapter },
        { provide: IApiKeyVerifierPort,  useClass: ApiKeyVerifierAdapter },
        { provide: IRecaptchaPort,       useClass: RecaptchaAdapter },
        { provide: IUserRolePort,        useClass: UserRoleAdapter },
        AuthFacade,

        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
      ],
      exports: [
        AUTH2_OPTIONS,
        IJwtVerifierPort,
        IApiKeyVerifierPort,
        IUserAccessPort,
        IRecaptchaPort,
        IUserRolePort,
        AuthFacade,
      ],
    };
  }
}
