import { Injectable } from '@nestjs/common';
import { ICACHE_PORT, ICachePort, CacheSetOptions } from '@nabarun-ngo/nestjs-shared-core';
import { CacheService } from '@nabarun-ngo/nestjs-shared-persistence';

@Injectable()
export class CachePortAdapter implements ICachePort {
  constructor(private readonly cache: CacheService) { }

  get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key).then((v) => v ?? null);
  }

  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    return this.cache.set(key, value, options?.ttlMs);
  }

  del(key: string): Promise<void> {
    return this.cache.del(key);
  }

  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number,
    options?: { cacheNull?: boolean },
  ): Promise<T> {
    return this.cache.getOrSet(key, factory, ttlMs, options);
  }
}

export const CACHE_PORT_PROVIDER = {
  provide: ICACHE_PORT,
  useClass: CachePortAdapter,
};
