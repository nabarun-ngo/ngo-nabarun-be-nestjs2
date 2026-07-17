export { Auth2Module as AuthModule } from './auth.module';
export type { Auth2ModuleAsyncOptions as AuthModuleAsyncOptions } from './auth.module';
export type { Auth2ModuleOptions as AuthModuleOptions } from './auth-options';
export { Auth2OptionsSchema as AuthOptionsSchema} from './auth.schema';

export { seedAuth2 as seedAuth } from './infrastructure/seeds/auth.seeder';
export type {
  Auth2SeedData as AuthSeedData,
  Auth2PermissionSeed as AuthPermissionSeed,
  Auth2RoleSeed as AuthRoleSeed,
  Auth2RoleGroupSeed as AuthRoleGroupSeed,
} from './infrastructure/seeds/auth-seed.types';

export { CurrentUser, UserPermissions } from './presentation/decorators/current-user.decorator';
export { RequirePermissions, RequireAllPermissions, REQUIRE_PERMISSIONS_KEY } from './presentation/decorators/require-permissions.decorator';
export { RequireRoles, REQUIRE_ROLES_KEY } from './presentation/decorators/require-roles.decorator';
export { RequireRoleGroups, REQUIRE_ROLE_GROUPS_KEY } from './presentation/decorators/require-role-groups.decorator';
export { Public, IS_PUBLIC_KEY } from './presentation/decorators/public.decorator';
export { UseApiKey, USE_API_KEY } from './presentation/decorators/use-api-key.decorator';
export { IgnoreCaptcha, IGNORE_CAPTCHA } from './presentation/decorators/ignore-captcha.decorator';
export { ExpectedRecaptchaAction, EXPECTED_RECAPTCHA_ACTION_KEY } from './presentation/decorators/expected-recaptcha-action.decorator';
export { StrictThrottle, DefaultThrottle, PublicGetThrottle, PublicFormPostThrottle, NewsletterThrottle } from './presentation/decorators/throttle-presets';
export {
  RequirePermissionsInScope,
  REQUIRE_PERMISSIONS_IN_SCOPE_KEY,
} from './presentation/decorators/require-permissions-in-scope.decorator';
export type {
  ScopeSource,
  RequirePermissionsInScopeMeta,
} from './presentation/decorators/require-permissions-in-scope.decorator';
export { UnifiedAuthGuard } from './presentation/guards/unified-auth.guard';
export { RolesGuard } from './presentation/guards/roles.guard';
export { PermissionsGuard } from './presentation/guards/permissions.guard';
export { RoleGroupsGuard } from './presentation/guards/role-groups.guard';
export { ScopedPermissionsGuard } from './presentation/guards/scoped-permissions.guard';

export type { AuthUser, ScopedRoleContext } from './application/models/auth-user';

export { IUserAccessPort } from './application/ports/user-access.port';
export { IJwtVerifierPort } from './application/ports/jwt-verifier.port';
export { IApiKeyVerifierPort } from './application/ports/api-key-verifier.port';
export { IRecaptchaPort } from './application/ports/recaptcha.port';

export { IUserRolePort } from './domain/ports/user-role.port';
export { AuthFacade } from './application/services/auth.facade';

export { IRoleRepository } from './domain/repositories/role.repository';
export { IRoleGroupRepository } from './domain/repositories/role-group.repository';
export { IPermissionRepository } from './domain/repositories/permission.repository';
export { IUserRoleRepository } from './domain/repositories/user-role.repository';
export { IUserRoleGroupRepository } from './domain/repositories/user-role-group.repository';
export { IApiKeyRepository } from './domain/repositories/api-key.repository';
