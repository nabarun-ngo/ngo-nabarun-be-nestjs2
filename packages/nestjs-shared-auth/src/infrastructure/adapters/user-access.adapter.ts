import { Inject, Injectable, Optional } from '@nestjs/common';
import { ICACHE_PORT, ICachePort, IUserLookupPort } from '@nabarun-ngo/nestjs-shared-core';
import { IUserAccessPort } from '../../application/ports/user-access.port';
import { AuthUser, ScopedRoleContext } from '../../application/models/auth-user';
import { AUTH2_OPTIONS } from '../auth-options.token';
import { Auth2ModuleOptions } from '../../auth-options';
import { IUserRoleRepository } from '../../domain/repositories/user-role.repository';
import { IUserRoleGroupRepository } from '../../domain/repositories/user-role-group.repository';

@Injectable()
export class UserAccessAdapter implements IUserAccessPort {
  constructor(
    @Inject(IUserRoleRepository) private readonly userRoleRepo: IUserRoleRepository,
    @Inject(IUserRoleGroupRepository) private readonly userRoleGroupRepo: IUserRoleGroupRepository,
    @Inject(AUTH2_OPTIONS) private readonly options: Auth2ModuleOptions,
    @Inject(ICACHE_PORT) private readonly cache: ICachePort,
    @Optional() @Inject(IUserLookupPort) private readonly userLookup: IUserLookupPort | null,
  ) { }

  private cacheKey(idpSub: string): string {
    return `user-access:${idpSub}`;
  }

  async resolve(idpSub: string): Promise<AuthUser> {
    const ttl = this.options.cache?.userAccessTtlMs ?? 1_800_000;
    return this.cache.getOrSet(this.cacheKey(idpSub), () => this.resolveFromDb(idpSub), ttl);
  }

  async invalidate(idpSub: string): Promise<void> {
    await this.cache.del(this.cacheKey(idpSub));
  }

  private async resolveFromDb(idpSub: string): Promise<AuthUser> {
    const [directRoles, groupMemberships, userInfo] = await Promise.all([
      this.userRoleRepo.resolveDirectPermissions(idpSub),
      this.userRoleGroupRepo.resolveGroupPermissions(idpSub),
      this.userLookup?.findByIdPSub(idpSub) ?? Promise.resolve(null),
    ]);

    const permissionSet = new Set<string>();
    const roleSet = new Set<string>();
    const groupSet = new Set<string>();
    const scopedRoles: Record<string, ScopedRoleContext> = {};

    for (const view of directRoles) {
      if (view.entityId && view.entityType) {
        const key = `${view.entityType}:${view.entityId}`;
        scopedRoles[key] ??= { permissions: [], roles: [], roleGroups: [] };
        scopedRoles[key].roles.push(view.roleKey);
        view.permissionKeys.forEach((k) => {
          if (!scopedRoles[key].permissions.includes(k)) scopedRoles[key].permissions.push(k);
        });
      } else {
        roleSet.add(view.roleKey);
        view.permissionKeys.forEach((k) => permissionSet.add(k));
      }
    }

    for (const view of groupMemberships) {
      if (view.entityId && view.entityType) {
        const key = `${view.entityType}:${view.entityId}`;
        scopedRoles[key] ??= { permissions: [], roles: [], roleGroups: [] };
        if (!scopedRoles[key].roleGroups.includes(view.groupKey)) {
          scopedRoles[key].roleGroups.push(view.groupKey);
        }
        view.roleKeys.forEach((k) => {
          if (!scopedRoles[key].roles.includes(k)) scopedRoles[key].roles.push(k);
        });
        view.permissionKeys.forEach((k) => {
          if (!scopedRoles[key].permissions.includes(k)) scopedRoles[key].permissions.push(k);
        });
      } else {
        groupSet.add(view.groupKey);
        view.roleKeys.forEach((k) => roleSet.add(k));
        view.permissionKeys.forEach((k) => permissionSet.add(k));
      }
    }

    return {
      type: 'jwt',
      idpSub,
      userId: userInfo?.id ?? undefined,
      userInfo: userInfo ?? undefined,
      roleGroups: [...groupSet],
      permissions: [...permissionSet],
      userRoles: [...roleSet],
      scopedRoles,
    };
  }
}
