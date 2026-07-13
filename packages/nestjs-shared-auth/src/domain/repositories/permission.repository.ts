import { IRepository } from '@ce/nestjs-shared-core';
import { Permission, PermissionFilter } from '../aggregates/permission/permission.aggregate';

export const IPermissionRepository = Symbol('IPermissionRepository');

export interface IPermissionRepository extends IRepository<Permission, string, PermissionFilter> {
  findByKey(key: string): Promise<Permission | null>;
}
