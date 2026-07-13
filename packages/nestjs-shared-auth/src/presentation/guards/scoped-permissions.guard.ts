import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PERMISSIONS_IN_SCOPE_KEY,
  RequirePermissionsInScopeMeta,
  ScopeSource,
} from '../decorators/require-permissions-in-scope.decorator';
import { AuthUser } from '../../application/models/auth-user';

@Injectable()
export class ScopedPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.getAllAndOverride<RequirePermissionsInScopeMeta | undefined>(
      REQUIRE_PERMISSIONS_IN_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!meta || meta.permissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (!user) return false;

    const { scope, permissions: required } = meta;

    // Global super-admin shortcut: if the user holds all required permissions globally, allow.
    const globalPermissions = user.permissions ?? [];
    if (required.every((p) => globalPermissions.includes(p))) return true;

    // Resolve entityId and entityType from the request.
    const entityId = this.extractFromRequest(request, scope, scope.entityIdKey);
    const entityType = scope.entityTypeValue ?? (scope.entityTypeKey
      ? this.extractFromRequest(request, scope, scope.entityTypeKey)
      : undefined);

    if (!entityId || !entityType) {
      throw new ForbiddenException('Entity scope could not be resolved from the request.');
    }

    const scopeKey = `${entityType}:${entityId}`;
    const scopedPermissions = user.scopedRoles?.[scopeKey]?.permissions ?? [];

    if (required.every((p) => scopedPermissions.includes(p))) return true;

    throw new ForbiddenException(
      `Insufficient permissions for ${scopeKey}. Required: ${required.join(', ')}.`,
    );
  }

  private extractFromRequest(
    request: Record<string, any>,
    scope: ScopeSource,
    key: string,
  ): string | undefined {
    const source = request[scope.from] as Record<string, unknown> | undefined;
    const value = source?.[key];
    return typeof value === 'string' ? value : undefined;
  }
}
