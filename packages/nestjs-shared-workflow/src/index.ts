// ── Schema / Options ──────────────────────────────────────────────────────────
export {
  WorkflowModuleOptionsSchema,
} from './workflow.schema';
export type { WorkflowModuleOptions } from './workflow.schema';

export { WORKFLOW_OPTIONS } from './infrastructure/workflow-options.token';

// ── Module ────────────────────────────────────────────────────────────────────
export { WorkflowModule } from './workflow.module';
export type { WorkflowModuleAsyncOptions, WorkflowModuleOverrides } from './workflow.module';

// ── DSL — workflow definition ─────────────────────────────────────────────────
export {
  WorkflowElementTypeSchema,
  SequenceFlowSchema,
  WorkflowElementSchema,
  WorkflowDefinitionSchema,
  parseWorkflowDefinition,
  safeParseWorkflowDefinition,
} from './dsl/workflow-definition.schema';
export type {
  WorkflowElementType,
  SequenceFlow,
  WorkflowElement,
  WorkflowDefinition,
} from './dsl/workflow-definition.schema';

// ── Domain — enums ────────────────────────────────────────────────────────────
export { WorkflowInstanceStatus } from './domain/enums/workflow-instance-status.enum';
export { InboxTaskStatus } from './domain/enums/inbox-task-status.enum';

// ── Domain — errors ───────────────────────────────────────────────────────────
export {
  WorkflowDefinitionNotFoundError,
  WorkflowDefinitionDraftNotStartableError,
  WorkflowInstanceNotFoundError,
  WorkflowTaskNotFoundError,
  WorkflowInvalidStateError,
  WorkflowTaskNotClaimableError,
  WorkflowTaskNotCompletableError,
  WorkflowUnauthorizedTaskActionError,
  WorkflowElementNotFoundError,
  WorkflowNoOutgoingFlowError,
  WorkflowServiceTaskHandlerNotFoundError,
  WorkflowOptimisticLockError,
  WorkflowIdempotencyConflictError,
} from './domain/errors/workflow.errors';

// ── Domain — ports (consumers implement adapters) ─────────────────────────────
export { WORKFLOW_DEFINITION_PORT } from './domain/ports/workflow-definition.port';
export type { IWorkflowDefinitionPort } from './domain/ports/workflow-definition.port';
export { parseStoredWorkflowDefinition } from './domain/ports/workflow-definition.port';

export { IWorkflowInstanceRepository } from './domain/ports/workflow-instance.repository';
export type {
  WorkflowInstanceRecord,
  WorkflowInstanceFilter,
} from './domain/ports/workflow-instance.repository';

export { WORKFLOW_QUEUE_PORT } from './domain/ports/workflow-queue.port';
export type {
  IWorkflowQueuePort,
  WorkflowQueueJobType,
  WorkflowQueueJobPayload,
} from './domain/ports/workflow-queue.port';

export { WORKFLOW_FORM_DATA_PORT } from './domain/ports/workflow-form-data.port';
export type {
  IWorkflowFormDataPort,
  WorkflowFormDataSnapshot,
} from './domain/ports/workflow-form-data.port';

export { WORKFLOW_USER_RESOLUTION_PORT } from './domain/ports/workflow-user-resolution.port';
export type {
  IWorkflowUserResolutionPort,
  ResolvedWorkflowAssignee,
} from './domain/ports/workflow-user-resolution.port';

export { IWorkflowInboxRepository } from './domain/ports/workflow-inbox.repository';
export type {
  WorkflowInboxTaskRecord,
  WorkflowInboxFilter,
} from './domain/ports/workflow-inbox.repository';

export { IWorkflowEventLogRepository } from './domain/ports/workflow-event-log.repository';
export type {
  WorkflowEventLogEntry,
  AppendWorkflowEventInput,
} from './domain/ports/workflow-event-log.repository';

export { IWorkflowOutboxRepository } from './domain/ports/workflow-outbox.repository';
export type {
  WorkflowOutboxRecord,
  CreateWorkflowOutboxInput,
} from './domain/ports/workflow-outbox.repository';
export { WorkflowOutboxStatus } from './domain/ports/workflow-outbox.repository';

export { IWorkflowIdempotencyRepository } from './domain/ports/workflow-idempotency.repository';
export type {
  WorkflowIdempotencyRecord,
  WorkflowIdempotencyScope,
  WorkflowIdempotencyClaimInput,
} from './domain/ports/workflow-idempotency.repository';

export { IWorkflowTokenRepository } from './domain/ports/workflow-token.repository';
export type {
  WorkflowTokenRecord,
  CreateWorkflowTokenInput,
  WorkflowTokenFilter,
} from './domain/ports/workflow-token.repository';
export { WorkflowTokenStatus } from './domain/ports/workflow-token.repository';

// ── Application — facade & services ───────────────────────────────────────────
export { WorkflowFacade } from './application/services/workflow.facade';
export { WorkflowOrchestratorService } from './application/services/workflow-orchestrator.service';
export { EventLogService } from './application/services/event-log.service';
export { TaskHandlerRegistryService } from './application/services/task-handler-registry.service';
export type {
  WorkflowTaskHandlerContract,
  WorkflowCompensationHandlerContract,
} from './application/services/task-handler-registry.service';

// ── Engine ────────────────────────────────────────────────────────────────────
export { TransitionRouter } from './engine/transition.router';
export { ContextProjectionService } from './engine/context-projection.service';
export { TokenManager } from './engine/token.manager';
export { StateMachineRunner } from './engine/state-machine.runner';
export { TimerScheduler } from './engine/timer.scheduler';
export { OutboxDispatcherService } from './engine/outbox-dispatcher.service';
export { IdempotencyService } from './engine/idempotency.service';
export { generateWorkflowInstanceId } from './application/utilities/workflow-id.util';

// ── Infrastructure — decorators ───────────────────────────────────────────────
export {
  WorkflowTaskHandler,
  WORKFLOW_TASK_HANDLER_METADATA,
} from './infrastructure/decorators/workflow-task-handler.decorator';
export type { WorkflowTaskHandlerMetadata } from './infrastructure/decorators/workflow-task-handler.decorator';
export {
  WorkflowCompensationHandler,
  WORKFLOW_COMPENSATION_HANDLER_METADATA,
} from './infrastructure/decorators/workflow-compensation-handler.decorator';
export type { WorkflowCompensationHandlerMetadata } from './infrastructure/decorators/workflow-compensation-handler.decorator';

// ── Jobs ──────────────────────────────────────────────────────────────────────
export { ProcessServiceTaskJob } from './application/jobs/process-service-task.job';
export { WorkflowTimerJob } from './application/jobs/workflow-timer.job';
export { EscalationJob } from './application/jobs/escalation.job';
export { OutboxDispatchJob } from './application/jobs/outbox-dispatch.job';
export { DetectStuckWorkflowsJob } from './application/jobs/detect-stuck-workflows.job';

// ── CQRS — commands ───────────────────────────────────────────────────────────
export { StartWorkflowCommand } from './application/commands/start-workflow/start-workflow.command';
export { CompleteUserTaskCommand } from './application/commands/complete-user-task/complete-user-task.command';
export { ClaimTaskCommand } from './application/commands/claim-task/claim-task.command';
export { DelegateTaskCommand } from './application/commands/delegate-task/delegate-task.command';
export { CancelWorkflowCommand } from './application/commands/cancel-workflow/cancel-workflow.command';
export { PublishDefinitionCommand } from './application/commands/publish-definition/publish-definition.command';
export { ForceSkipElementCommand } from './application/commands/force-skip-element/force-skip-element.command';

// ── CQRS — queries ────────────────────────────────────────────────────────────
export { GetWorkflowInstanceQuery } from './application/queries/get-workflow-instance/get-workflow-instance.query';
export { GetMyInboxQuery } from './application/queries/get-my-inbox/get-my-inbox.query';
export { GetWorkflowTimelineQuery } from './application/queries/get-workflow-timeline/get-workflow-timeline.query';
export { GetStuckWorkflowsQuery } from './application/queries/get-stuck-workflows/get-stuck-workflows.query';

// ── Domain — requester ────────────────────────────────────────────────────────
export {
  WorkflowRequesterType,
  resolveWorkflowRequester,
} from './domain/models/workflow-requester';
export type { WorkflowRequester } from './domain/models/workflow-requester';

// ── DTOs ──────────────────────────────────────────────────────────────────────
export {
  StartWorkflowRequestDto,
  CompleteUserTaskRequestDto,
  DelegateTaskRequestDto,
  CancelWorkflowRequestDto,
  PublishDefinitionRequestDto,
  ForceSkipElementRequestDto,
  WorkflowInstanceDto,
  WorkflowInboxTaskDto,
  WorkflowTimelineEntryDto,
} from './application/dtos/workflow.dtos';
