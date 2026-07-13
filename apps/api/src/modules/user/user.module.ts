import { DynamicModule, FactoryProvider, ModuleMetadata, Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JsonStoreModule } from '@ce/nestjs-shared-json-store';

import { UserModuleInput, UserModuleOptions, UserModuleOptionsSchema } from './user.schema';
import { USER_OPTIONS } from './infrastructure/user-options.token';

// Domain
import { IUserRepository } from './domain/repositories/user.repository';
import { IIdentityProvider } from './domain/ports/identity-provider.port';
import { IUserReferenceDataPort } from './application/ports/user-reference-data.port';

// Auth2
import { IUserLookupPort } from '@ce/nestjs-shared-core';

// Infrastructure
import { UserPrismaRepository } from '../../persistence/user/user.prisma-repository';
import { Auth0IdentityAdapter } from './infrastructure/external/auth0-identity.adapter';
import { UserLookupAdapter } from './infrastructure/adapters/user-lookup.adapter';
import { UserReferenceDataAdapter } from './infrastructure/adapters/user-reference-data.adapter';
// Command handlers
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';
import { UpdateUserProfileHandler } from './application/commands/update-user-profile/update-user-profile.handler';
import { UpdateUserAdminHandler } from './application/commands/update-user-admin/update-user-admin.handler';
import { InitiatePasswordChangeHandler } from './application/commands/initiate-password-change/initiate-password-change.handler';
import { DeleteUserHandler } from './application/commands/delete-user/delete-user.handler';
import { GrantUserConnectionHandler } from './application/commands/grant-user-connection/grant-user-connection.handler';
import { RevokeUserConnectionHandler } from './application/commands/revoke-user-connection/revoke-user-connection.handler';

// Query handlers
import { GetUserByIdHandler } from './application/queries/get-user-by-id/get-user-by-id.handler';
import { GetMyProfileHandler } from './application/queries/get-my-profile/get-my-profile.handler';
import { ListUsersHandler } from './application/queries/list-users/list-users.handler';
import { GetUserReferenceDataHandler } from './application/queries/get-user-reference-data/get-user-reference-data.handler';
import { GetUserConnectionsHandler } from './application/queries/get-user-connections/get-user-connections.handler';

// Event handlers
import { OnUserCreatedHandler } from './application/event-handlers/on-user-created/on-user-created.handler';
import { OnUserProfileUpdatedHandler } from './application/event-handlers/on-user-profile-updated/on-user-profile-updated.handler';
import { OnUserDeletedHandler } from './application/event-handlers/on-user-deleted/on-user-deleted.handler';
import { OnUserStatusChangedHandler } from './application/event-handlers/on-user-status-changed/on-user-status-changed.handler';

// Presentation
import { UserController } from './presentation/controllers/user.controller';

const COMMAND_HANDLERS = [
  CreateUserHandler,
  UpdateUserProfileHandler,
  UpdateUserAdminHandler,
  InitiatePasswordChangeHandler,
  DeleteUserHandler,
  GrantUserConnectionHandler,
  RevokeUserConnectionHandler,
];

const QUERY_HANDLERS = [
  GetUserByIdHandler,
  GetMyProfileHandler,
  ListUsersHandler,
  GetUserReferenceDataHandler,
  GetUserConnectionsHandler,
];

const EVENT_HANDLERS = [
  OnUserCreatedHandler,
  OnUserProfileUpdatedHandler,
  OnUserDeletedHandler,
  OnUserStatusChangedHandler,
];

export interface UserModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: FactoryProvider['inject'];
  useFactory: (...args: any[]) => UserModuleInput | Promise<UserModuleInput>;
}

@Module({})
export class UserModule {
  /**
   * Register the User bounded context with a static options object.
   * Useful in tests or when all values are known at compile time.
   *
   * IMPORTANT: Must be imported AFTER AuthModule in app.module.ts so that
   * IUserAccessPort (provided by AuthModule) is available for injection.
   *
   * @example
   * UserModule.forRoot({
   *   idp: { domain: '...', clientId: '...', clientSecret: '...' },
   *   defaultRoleKeys: ['MEMBER'],
   * })
   */
  static forRoot(options: UserModuleInput): DynamicModule {
    const parsed = UserModuleOptionsSchema.parse(options);
    return UserModule.buildModule([{ provide: USER_OPTIONS, useValue: parsed }]);
  }

  /**
   * Register the User bounded context with an async factory.
   * Use this in production so that secrets can be read from ConfigService.
   *
   * IMPORTANT: Must be imported AFTER AuthModule in app.module.ts.
   *
   * @example
   * UserModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     idp: {
   *       domain:       config.getOrThrow(Configkey.AUTH0_DOMAIN),
   *       clientId:     config.getOrThrow(Configkey.AUTH0_MANAGEMENT_CLIENT_ID),
   *       clientSecret: config.getOrThrow(Configkey.AUTH0_MANAGEMENT_CLIENT_SECRET),
   *     },
   *     defaultRoleKeys:      ['MEMBER'],
   *     passwordExpiresInDays: 90,
   *   }),
   * })
   */
  static forRootAsync(asyncOptions: UserModuleAsyncOptions): DynamicModule {
    const optionsProvider: FactoryProvider = {
      provide: USER_OPTIONS,
      inject: asyncOptions.inject ?? [],
      useFactory: async (...args: any[]) => {
        const raw = await asyncOptions.useFactory(...args);
        return UserModuleOptionsSchema.parse(raw);
      },
    };
    return UserModule.buildModule([optionsProvider], asyncOptions.imports ?? []);
  }

  private static buildModule(
    optionProviders: Provider[],
    extraImports: any[] = [],
  ): DynamicModule {
    return {
      module: UserModule,
      imports: [CqrsModule, JsonStoreModule.forRoot(), ...extraImports],
      controllers: [UserController],
      providers: [
        ...optionProviders,

        // Domain ports → infrastructure implementations
        { provide: IUserRepository, useClass: UserPrismaRepository },
        { provide: IIdentityProvider, useClass: Auth0IdentityAdapter },
        { provide: IUserReferenceDataPort, useClass: UserReferenceDataAdapter },

        // IUserLookupPort — consumed by Auth2's UserAccessAdapter on JWT verification
        // and used by Correspondence2 for user resolution.
        UserLookupAdapter,
        { provide: IUserLookupPort, useClass: UserLookupAdapter },

        // CQRS handlers
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
      ],
      exports: [
        IUserRepository,
        IUserLookupPort,
      ],
    };
  }
}
