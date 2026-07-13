import { Injectable, Logger } from "@nestjs/common";
import { BasePrismaService } from "./base-prisma.service";

/** Minimal tx client shape used for advisory-lock transactions. */
type AdvisoryLockTransaction = {
  $executeRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
};

@Injectable()
export class LockingService {
  private readonly logger = new Logger(LockingService.name);

  constructor(private readonly prisma: BasePrismaService) {}

  /**
   * Execute a function with a single lock
   * @param key Lock key
   * @param fn Function to execute. Receives the transaction client that owns the lock.
   */
  async withLock<T>(
    key: string,
    fn: (tx: AdvisoryLockTransaction) => Promise<T>,
  ): Promise<T> {
    return this.withLocks([key], fn);
  }

  /**
   * Execute a function with multiple locks (to prevent deadlocks)
   * All locks are acquired in a single transaction and released when it ends.
   * @param keys Lock keys
   * @param fn Function to execute. Use the provided transaction client for DB work
   * that must be atomic with the lock.
   */
  async withLocks<T>(
    keys: string[],
    fn: (tx?: AdvisoryLockTransaction) => Promise<T>,
  ): Promise<T> {
    if (keys.length === 0) return await fn();

    // Sort keys to prevent deadlocks (canonical ordering)
    const sortedKeys = [...new Set(keys)].sort();

    this.logger.debug(`Acquiring postgres locks for: ${sortedKeys.join(", ")}`);

    return await this.prisma.client.$transaction(
      async (tx) => {
        const txClient = tx as AdvisoryLockTransaction;
        for (const key of sortedKeys) {
          // hashtextextended() gives the advisory lock a 64-bit key and lowers
          // collision risk compared with hashtext()'s 32-bit output.
          await txClient.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
        }
        this.logger.debug(
          `Acquired all postgres locks: ${sortedKeys.join(", ")}`,
        );
        try {
          return await fn(txClient);
        } catch (error) {
          this.logger.error(
            `Error while holding locks for [${sortedKeys.join(", ")}]`,
            error,
          );
          throw error;
        }
      },
      {
        timeout: 60000, // 60s timeout for the whole operation
      },
    );
  }
}
