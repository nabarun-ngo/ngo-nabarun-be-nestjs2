import { DomainEvent } from '@ce/nestjs-shared-core';
import type { ApiKey } from '../aggregates/api-key/api-key.aggregate';

export type ApiKeyUsedSnapshot = Pick<ApiKey, 'id' | 'keyId'>;

export class ApiKeyUsedEvent extends DomainEvent<ApiKeyUsedSnapshot> {
  constructor(snapshot: ApiKeyUsedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
