import { IRepository } from '@ce/nestjs-shared-core';
import { Role, RoleFilter } from '../aggregates/role/role.aggregate';

export const IRoleRepository = Symbol('IRoleRepository');

export interface IRoleRepository extends IRepository<Role, string, RoleFilter> {
  findByKey(key: string): Promise<Role | null>;
  findWithPermissions(key: string): Promise<Role | null>;
  findWithPermissionsById(id: string): Promise<Role | null>;
  syncPermissions(roleId: string, permissionIds: string[]): Promise<void>;
}
