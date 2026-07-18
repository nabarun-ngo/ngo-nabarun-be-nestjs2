import { IRepository } from '@nabarun-ngo/nestjs-shared-core';
import { UserRoleGroup, UserRoleGroupFilter } from '../aggregates/user-role-group/user-role-group.aggregate';
import { UserRole } from '../aggregates/user-role/user-role.aggregate';

export const IUserRoleGroupRepository = Symbol('IUserRoleGroupRepository');

export interface GroupPermissionView {
  groupKey: string;
  roleKeys: string[];
  permissionKeys: string[];
  ownerId?: string;
  entityId?: string;
  entityType?: string;
}

export interface IUserRoleGroupRepository
  extends IRepository<UserRoleGroup, string, UserRoleGroupFilter> {
  findActiveByIdPSub(idpSub: string): Promise<UserRoleGroup[]>;
  resolveGroupPermissions(idpSub: string): Promise<GroupPermissionView[]>;
  revokeGroupMembership(idpSub: string, groupId: string, revokedBy?: string): Promise<void>;
  /** Atomically persists the membership and all derived user-role rows in one transaction. */
  createMembershipWithRoles(membership: UserRoleGroup, userRoles: UserRole[]): Promise<void>;
  /** Returns idpSubs of all users who are active members of any group that holds this role. */
  findIdPSubsByRoleKey(roleKey: string): Promise<string[]>;
}
