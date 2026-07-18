import { BaseFilter } from '@nabarun-ngo/nestjs-shared-core';
import { RoleFilter } from '../../../domain/aggregates/role/role.aggregate';

export class ListRolesQuery {
  constructor(public readonly filter?: BaseFilter<RoleFilter>) { }
}
