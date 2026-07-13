import { Inject, Injectable } from '@nestjs/common';
import { validateApiKey as verifyKeyHash } from '@ce/nestjs-shared-core';
import { CacheService } from '@ce/nestjs-shared-persistence';
import { IApiKeyVerifierPort } from '../../application/ports/api-key-verifier.port';
import { IApiKeyRepository } from '../../domain/repositories/api-key.repository';
import { ApiKey } from '../../domain/aggregates/api-key/api-key.aggregate';
import { InvalidApiKeyError } from '../../domain/errors/auth.errors';
import { AuthUser } from '../../application/models/auth-user';
import { AUTH2_OPTIONS } from '../auth-options.token';
import { Auth2ModuleOptions } from '../../auth-options';


@Injectable()
export class ApiKeyVerifierAdapter implements IApiKeyVerifierPort {
  constructor(
    @Inject(IApiKeyRepository) private readonly repo: IApiKeyRepository,
    @Inject(AUTH2_OPTIONS) private readonly options: Auth2ModuleOptions,
    @Inject(CacheService) private readonly cache: CacheService,
  ) {}

  private cacheKey(keyId: string): string {
    return `api-key:${keyId}`;
  }

  async validate(rawKey: string): Promise<AuthUser> {
    const keyId = ApiKey.fetchKeyId(rawKey);
    if (!keyId) throw new InvalidApiKeyError();

    const cached = await this.cache.get<AuthUser>(this.cacheKey(keyId));
    if (cached) return cached;

    const keyInfo = await this.repo.findByKeyId(keyId);
    if (!keyInfo) throw new InvalidApiKeyError();

    const hashMatches = await verifyKeyHash(rawKey, keyInfo.key);
    if (!hashMatches || keyInfo.isExpired()) throw new InvalidApiKeyError();

    const authUser: AuthUser = {
      type: 'apikey',
      idpSub: `apikey:${keyInfo.id}`,
      userId: keyInfo.ownerId ?? undefined,
      permissions: keyInfo.permissions,
      name: keyInfo.name,
    };

    const ttl = this.options.cache?.apiKeyTtlMs ?? 1_800_000;
    await this.cache.set(this.cacheKey(keyId), authUser, ttl);

    return authUser;
  }

  async invalidate(keyId: string): Promise<void> {
    await this.cache.del(this.cacheKey(keyId));
  }
}
