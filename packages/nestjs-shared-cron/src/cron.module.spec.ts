/**
 * Cron2Module.forRoot / forRootAsync unit tests.
 * Inspects the returned DynamicModule without running NestJS DI.
 * Supersedes: test/cron/cron.module.spec.ts (module wiring coverage)
 */

// ── Mock heavy infrastructure to avoid peer-dep import errors ────────────────
jest.mock('@ce/nestjs-shared-cron/infrastructure/adapters/json-store-cron-job.adapter', () => ({
  JsonStoreCronJobAdapter: class JsonStoreCronJobAdapter {},
}));
jest.mock('@ce/nestjs-shared-cron/infrastructure/adapters/queue-cron-job.adapter', () => ({
  QueueCronJobAdapter: class QueueCronJobAdapter {},
}));
jest.mock('@ce/nestjs-shared-cron/application/commands/trigger-cron-jobs/trigger-cron-jobs.handler', () => ({
  TriggerCronJobsHandler: class TriggerCronJobsHandler {},
}));
jest.mock('@ce/nestjs-shared-cron/application/commands/create-cron-job/create-cron-job.handler', () => ({
  CreateCronJobHandler: class CreateCronJobHandler {},
}));
jest.mock('@ce/nestjs-shared-cron/application/commands/update-cron-job/update-cron-job.handler', () => ({
  UpdateCronJobHandler: class UpdateCronJobHandler {},
}));
jest.mock('@ce/nestjs-shared-cron/application/commands/delete-cron-job/delete-cron-job.handler', () => ({
  DeleteCronJobHandler: class DeleteCronJobHandler {},
}));
jest.mock('@ce/nestjs-shared-cron/application/commands/run-cron-job/run-cron-job.handler', () => ({
  RunCronJobHandler: class RunCronJobHandler {},
}));
jest.mock('@ce/nestjs-shared-cron/application/queries/get-cron-jobs/get-cron-jobs.handler', () => ({
  GetCronJobsHandler: class GetCronJobsHandler {},
}));
jest.mock('@ce/nestjs-shared-cron/presentation/controllers/cron.controller', () => ({
  Cron2Controller: class Cron2Controller {},
}));
jest.mock('@ce/nestjs-shared-json-store', () => ({
  JsonStoreModule: { forRoot: () => ({ module: class JsonStoreModule {} }) },
}));
jest.mock('@nestjs/cqrs', () => ({
  CqrsModule: class CqrsModule {},
  CommandHandler: () => () => {},
  QueryHandler: () => () => {},
  EventsHandler: () => () => {},
  CommandBus: class CommandBus {},
  QueryBus: class QueryBus {},
  ICommandHandler: class {},
  IQueryHandler: class {},
}));

// ── Imports ──────────────────────────────────────────────────────────────────
import { Cron2Module } from '@ce/nestjs-shared-cron/cron.module';
import { CRON2_OPTIONS } from '@ce/nestjs-shared-cron/infrastructure/cron-options.token';
import { CRON_JOB_STORE_PORT } from '@ce/nestjs-shared-cron/domain/ports/cron-job-store.port';
import { CRON_JOB_QUEUE_PORT } from '@ce/nestjs-shared-cron/domain/ports/cron-job-queue.port';

describe('Cron2Module', () => {
  describe('forRoot()', () => {
    it('returns a DynamicModule object', () => {
      const mod = Cron2Module.forRoot();
      expect(mod).toBeDefined();
      expect(typeof mod).toBe('object');
    });

    it('identifies Cron2Module as the module class', () => {
      const mod = Cron2Module.forRoot();
      expect(mod.module).toBe(Cron2Module);
    });

    it('provides CRON2_OPTIONS with the validated options', () => {
      const mod = Cron2Module.forRoot({ timezone: 'UTC' });
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON2_OPTIONS);
      expect(provider).toBeDefined();
      expect(provider.useValue.timezone).toBe('UTC');
    });

    it('defaults timezone to UTC when no options are provided', () => {
      const mod = Cron2Module.forRoot();
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON2_OPTIONS);
      expect(provider.useValue.timezone).toBe('UTC');
    });

    it('accepts a custom timezone', () => {
      const mod = Cron2Module.forRoot({ timezone: 'Asia/Kolkata' });
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON2_OPTIONS);
      expect(provider.useValue.timezone).toBe('Asia/Kolkata');
    });

    it('provides CRON_JOB_STORE_PORT', () => {
      const mod = Cron2Module.forRoot();
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON_JOB_STORE_PORT);
      expect(provider).toBeDefined();
    });

    it('provides CRON_JOB_QUEUE_PORT', () => {
      const mod = Cron2Module.forRoot();
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON_JOB_QUEUE_PORT);
      expect(provider).toBeDefined();
    });

    it('registers Cron2Controller', () => {
      const mod = Cron2Module.forRoot();
      expect(mod.controllers).toBeDefined();
      expect((mod.controllers as any[]).length).toBeGreaterThan(0);
    });

    it('includes command and query handlers as providers', () => {
      const mod = Cron2Module.forRoot();
      // At minimum 5 command handlers + 1 query handler + 2 port providers + 1 options provider
      expect((mod.providers as any[]).length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('forRootAsync()', () => {
    it('returns a DynamicModule with the async factory pattern', () => {
      const mod = Cron2Module.forRootAsync({
        useFactory: () => ({ timezone: 'UTC' }),
      });
      expect(mod.module).toBe(Cron2Module);
    });

    it('stores the async useFactory on the CRON2_OPTIONS provider', () => {
      const mod = Cron2Module.forRootAsync({
        useFactory: () => ({ timezone: 'Europe/London' }),
      });
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON2_OPTIONS);
      expect(typeof provider.useFactory).toBe('function');
    });

    it('wires inject tokens to the async factory', () => {
      const CONFIG_TOKEN = Symbol('Config');
      const mod = Cron2Module.forRootAsync({
        inject: [CONFIG_TOKEN],
        useFactory: (_cfg: any) => ({ timezone: 'UTC' }),
      });
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON2_OPTIONS);
      expect(provider.inject).toContain(CONFIG_TOKEN);
    });

    it('validates and returns options from the async factory', async () => {
      const mod = Cron2Module.forRootAsync({
        useFactory: () => ({ timezone: 'America/Chicago' }),
      });
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON2_OPTIONS);
      const result = await provider.useFactory();
      expect(result.timezone).toBe('America/Chicago');
    });

    it('throws when the async factory returns options with an invalid timezone type', async () => {
      const mod = Cron2Module.forRootAsync({
        useFactory: () => ({ timezone: 123 } as any),
      });
      const provider = (mod.providers as any[]).find((p) => p.provide === CRON2_OPTIONS);
      await expect(provider.useFactory()).rejects.toThrow();
    });
  });
});
