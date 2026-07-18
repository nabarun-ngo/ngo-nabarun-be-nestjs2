import { BaseFilter } from '@nabarun-ngo/nestjs-shared-core';
import { RoleGroupFilter } from '../../../domain/aggregates/role-group/role-group.aggregate';

export class ListRoleGroupsQuery {
  constructor(public readonly filter?: BaseFilter<RoleGroupFilter>) { }
}
