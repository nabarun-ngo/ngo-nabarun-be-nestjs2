import { BaseFilter } from '@nabarun-ngo/nestjs-shared-core';
import { ApiKeyFilter } from '../../../domain/aggregates/api-key/api-key.aggregate';

export class ListApiKeysQuery {
  constructor(
    public readonly filter?: BaseFilter<ApiKeyFilter>,
    /** The calling user's owner ID — restricts results to their own keys. */
    public readonly ownerId?: string,
  ) { }
}
