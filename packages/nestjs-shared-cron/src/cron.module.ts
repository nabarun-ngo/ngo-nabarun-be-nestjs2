import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BaseDynamicModule, DynamicModuleAsyncOptions } from '@ce/nestjs-shared-core';
import { JsonStoreModule } from '@ce/nestjs-shared-json-store';
import { QueueModule } from '@ce/nestjs-shared-queue';

import { Cron2ModuleOptions, Cron2OptionsSchema } from './cron.schema';
import { CRON2_OPTIONS } from './infrastructure/cron-options.token';

// ── Domain tokens ─────────────────────────────────────────────────────────────
import { CRON_JOB_STORE_PORT } from './domain/ports/cron-job-store.port';
import { CRON_JOB_QUEUE_PORT } from './domain/ports/cron-job-queue.port';

// ── Infrastructure ────────────────────────────────────────────────────────────
import { JsonStoreCronJobAdapter } from './infrastructure/adapters/json-store-cron-job.adapter';
import { QueueCronJobAdapter } from './infrastructure/adapters/queue-cron-job.adapter';

// ── Command handlers ──────────────────────────────────────────────────────────
import { TriggerCronJobsHandler } from './application/commands/trigger-cron-jobs/trigger-cron-jobs.handler';
import { CreateCronJobHandler } from './application/commands/create-cron-job/create-cron-job.handler';
import { UpdateCronJobHandler } from './application/commands/update-cron-job/update-cron-job.handler';
import { DeleteCronJobHandler } from './application/commands/delete-cron-job/delete-cron-job.handler';
import { RunCronJobHandler } from './application/commands/run-cron-job/run-cron-job.handler';

// ── Query handlers ────────────────────────────────────────────────────────────
import { GetCronJobsHandler } from './application/queries/get-cron-jobs/get-cron-jobs.handler';

// ── Presentation ──────────────────────────────────────────────────────────────
import { Cron2Controller } from './presentation/controllers/cron.controller';

export type { Cron2ModuleOptions } from './cron.schema';

export interface Cron2ModuleAsyncOptions
  extends DynamicModuleAsyncOptions<Cron2ModuleOptions> {}

const COMMAND_HANDLERS = [
  TriggerCronJobsHandler,
  CreateCronJobHandler,
  UpdateCronJobHandler,
  DeleteCronJobHandler,
  RunCronJobHandler,
];

const QUERY_HANDLERS = [GetCronJobsHandler];

@Module({})
export class Cron2Module extends BaseDynamicModule {
  static forRoot(options: Cron2ModuleOptions = {}): DynamicModule {
    return Cron2Module._build([
      Cron2Module.createOptionsProvider(CRON2_OPTIONS, Cron2OptionsSchema, options),
    ]);
  }

  static forRootAsync(options: Cron2ModuleAsyncOptions): DynamicModule {
    return Cron2Module._build(
      [
        {
          ...Cron2Module.createAsyncOptionsProvider(CRON2_OPTIONS, Cron2OptionsSchema, options),
        },
      ],
      options.imports,
    );
  }

  private static _build(
    optionsProviders: any[],
    extraImports: any[] = [],
  ): DynamicModule {
    return {
      module: Cron2Module,
      imports: [
        ...extraImports,
        CqrsModule,
        JsonStoreModule.forRoot(),
        QueueModule,
      ],
      controllers: [Cron2Controller],
      providers: [
        ...optionsProviders,
        { provide: CRON_JOB_STORE_PORT, useClass: JsonStoreCronJobAdapter },
        { provide: CRON_JOB_QUEUE_PORT, useClass: QueueCronJobAdapter },
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
      ],
      exports: [],
    };
  }
}
