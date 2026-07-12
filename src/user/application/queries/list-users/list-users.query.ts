import { SortOrder } from 'nestjs-shared/core';
import { UserFilter } from '../../../domain/repositories/user.repository';

export class ListUsersQuery {
  constructor(
    public readonly filter?: UserFilter,
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
    public readonly sortBy?: string,
    public readonly sortDir?: SortOrder,
  ) {}
}
