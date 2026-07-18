import { ApiKey, ApiKeyFilter } from '../aggregates/api-key/api-key.aggregate';
import { IRepository } from '@nabarun-ngo/nestjs-shared-core';

export const IApiKeyRepository = Symbol('IApiKeyRepository');

export interface IApiKeyRepository extends IRepository<ApiKey, string, ApiKeyFilter> {
  findByKeyId(keyId: string): Promise<ApiKey | null>;
}
