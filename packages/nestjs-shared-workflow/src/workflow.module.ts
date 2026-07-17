import { DynamicModule, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BaseDynamicModule, DynamicModuleAsyncOptions, createRequiredPortsGuard } from '@ce/nestjs-shared-core';
import { WorkflowModuleOptionsSchema } from './workflow.schema';
import type { WorkflowModuleOptions } from './workflow.schema';
import { WORKFLOW_OPTIONS } from './infrastructure/workflow-options.token';

import { WORKFLOW_DEFINITION_PORT } from './domain/ports/workflow-definition.port';
import { WORKFLOW_QUEUE_PORT } from './domain/ports/workflow-queue.port';
import { WORKFLOW_FORM_DATA_PORT } from './domain/ports/workflow-form-data.port';
import { WORKFLOW_USER_RESOLUTION_PORT } from './domain/ports/workflow-user-resolution.port';
import { IWorkflowInstanceRepository } from './domain/ports/workflow-instance.repository';
import { IWorkflowInboxRepository } from './domain/ports/workflow-inbox.repository';
import { IWorkflowEventLogRepository } from './domain/ports/workflow-event-log.repository';
import { IWorkflowOutboxRepository } from './domain/ports/workflow-outbox.repository';
import { IWorkflowTokenRepository } from './domain/ports/workflow-token.repository';
import { IWorkflowIdempotencyRepository } from './domain/ports/workflow-idempotency.repository';

import { TransitionRouter } from './engine/transition.router';
import { ContextProjectionService } from './engine/context-projection.service';
import { TokenManager } from './engine/token.manager';
import { StateMachineRunner } from './engine/state-machine.runner';
import { TimerScheduler } from './engine/timer.scheduler';
import { OutboxDispatcherService } from './engine/outbox-dispatcher.service';
import { IdempotencyService } from './engine/idempotency.service';

import { EventLogService } from './application/services/event-log.service';
import { WorkflowOrchestratorService } from './application/services/workflow-orchestrator.service';
import { WorkflowFacade } from './application/services/workflow.facade';
import { TaskHandlerRegistryService } from './application/services/task-handler-registry.service';

import { StartWorkflowHandler } from './application/commands/start-workflow/start-workflow.handler';
import { CompleteUserTaskHandler } from './application/commands/complete-user-task/complete-user-task.handler';
import { ClaimTaskHandler } from './application/commands/claim-task/claim-task.handler';
import { DelegateTaskHandler } from './application/commands/delegate-task/delegate-task.handler';
import { CancelWorkflowHandler } from './application/commands/cancel-workflow/cancel-workflow.handler';
import { PublishDefinitionHandler } from './application/commands/publish-definition/publish-definition.handler';
import { ForceSkipElementHandler } from './application/commands/force-skip-element/force-skip-element.handler';

import { GetWorkflowInstanceHandler } from './application/queries/get-workflow-instance/get-workflow-instance.handler';
import { GetMyInboxHandler } from './application/queries/get-my-inbox/get-my-inbox.handler';
import { GetWorkflowTimelineHandler } from './application/queries/get-workflow-timeline/get-workflow-timeline.handler';
import { GetStuckWorkflowsHandler } from './application/queries/get-stuck-workflows/get-stuck-workflows.handler';

import { ProcessServiceTaskHandler } from './infrastructure/queue/process-service-task.handler';
import { WorkflowTimerHandler } from './infrastructure/queue/workflow-timer.handler';
import { EscalationJobHandler } from './infrastructure/queue/escalation-job.handler';
import { OutboxDispatchHandler } from './infrastructure/queue/outbox-dispatch.handler';
import { DetectStuckWorkflowsHandler } from './infrastructure/queue/detect-stuck-workflows.handler';

import { WorkflowController } from './presentation/controllers/workflow.controller';
import { WorkflowAdminController } from './presentation/controllers/workflow-admin.controller';

export interface WorkflowModuleAsyncOptions
  extends DynamicModuleAsyncOptions<WorkflowModuleOptions> {}

export interface WorkflowModuleOverrides {
  imports?: ModuleMetadata['imports'];
  queueModule?: DynamicModule;
}

const WorkflowRequiredPortsGuard = createRequiredPortsGuard('WorkflowModule', [
  {
    token: WORKFLOW_DEFINITION_PORT,
    fixHint:
      'Register { provide: WORKFLOW_DEFINITION_PORT, useClass: ... } in IntegrationsModule.',
  },
  {
    token: WORKFLOW_QUEUE_PORT,
    fixHint:
      'Register { provide: WORKFLOW_QUEUE_PORT, useClass: ... } in IntegrationsModule. Requires QueueModule.',
  },
  {
    token: IWorkflowInstanceRepository,
    fixHint: 'Register IWorkflowInstanceRepository in PersistenceModule.',
  },
  {
    token: IWorkflowInboxRepository,
    fixHint: 'Register IWorkflowInboxRepository in PersistenceModule.',
  },
  {
    token: IWorkflowEventLogRepository,
    fixHint: 'Register IWorkflowEventLogRepository in PersistenceModule.',
  },
  {
    token: IWorkflowOutboxRepository,
    fixHint: 'Register IWorkflowOutboxRepository in PersistenceModule.',
  },
  {
    token: IWorkflowTokenRepository,
    fixHint: 'Register IWorkflowTokenRepository in PersistenceModule.',
  },
  {
    token: IWorkflowIdempotencyRepository,
    fixHint: 'Register IWorkflowIdempotencyRepository in PersistenceModule.',
  },
  {
    token: WORKFLOW_FORM_DATA_PORT,
    fixHint: 'Register { provide: WORKFLOW_FORM_DATA_PORT, useClass: ... } in IntegrationsModule.',
  },
  {
    token: WORKFLOW_USER_RESOLUTION_PORT,
    fixHint:
      'Register { provide: WORKFLOW_USER_RESOLUTION_PORT, useClass: ... } in IntegrationsModule.',
  },
]);

const COMMAND_HANDLERS = [
  StartWorkflowHandler,
  CompleteUserTaskHandler,
  ClaimTaskHandler,
  DelegateTaskHandler,
  CancelWorkflowHandler,
  PublishDefinitionHandler,
  ForceSkipElementHandler,
];

const QUERY_HANDLERS = [
  GetWorkflowInstanceHandler,
  GetMyInboxHandler,
  GetWorkflowTimelineHandler,
  GetStuckWorkflowsHandler,
];

const ENGINE_SERVICES = [
  TransitionRouter,
  ContextProjectionService,
  TokenManager,
  StateMachineRunner,
  TimerScheduler,
  OutboxDispatcherService,
  IdempotencyService,
  EventLogService,
  WorkflowOrchestratorService,
  WorkflowFacade,
  TaskHandlerRegistryService,
];

const QUEUE_HANDLERS = [
  ProcessServiceTaskHandler,
  WorkflowTimerHandler,
  EscalationJobHandler,
  OutboxDispatchHandler,
  DetectStuckWorkflowsHandler,
];

@Module({})
export class WorkflowModule extends BaseDynamicModule {
  static forRoot(
    options: WorkflowModuleOptions = {},
    overrides: WorkflowModuleOverrides = {},
  ): DynamicModule {
    return WorkflowModule._build(
      [WorkflowModule.createOptionsProvider(WORKFLOW_OPTIONS, WorkflowModuleOptionsSchema, options)],
      overrides,
    );
  }

  static forRootAsync(
    options: WorkflowModuleAsyncOptions,
    overrides: WorkflowModuleOverrides = {},
  ): DynamicModule {
    return WorkflowModule._build(
      [
        WorkflowModule.createAsyncOptionsProvider(
          WORKFLOW_OPTIONS,
          WorkflowModuleOptionsSchema,
          options,
        ),
      ],
      { ...overrides, imports: [...(overrides.imports ?? []), ...(options.imports ?? [])] },
    );
  }

  private static _build(
    optionsProviders: Provider[],
    overrides: WorkflowModuleOverrides,
  ): DynamicModule {
    if (!overrides.queueModule) {
      throw new Error(
        '[WorkflowModule] queueModule override is required. Pass QueueModule.forRoot/forRootAsync from the host.',
      );
    }

    return {
      module: WorkflowModule,
      imports: [...(overrides.imports ?? []), CqrsModule, overrides.queueModule],
      controllers: [WorkflowController, WorkflowAdminController],
      providers: [
        ...optionsProviders,
        WorkflowRequiredPortsGuard,
        ...ENGINE_SERVICES,
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...QUEUE_HANDLERS,
      ],
      exports: [WorkflowFacade],
    };
  }
}
