import { Inject, Injectable } from '@nestjs/common';
import { WorkflowInstanceStatus } from '../../domain/enums/workflow-instance-status.enum';
import { InboxTaskStatus } from '../../domain/enums/inbox-task-status.enum';
import {
  WorkflowDefinitionNotFoundError,
  WorkflowDefinitionDraftNotStartableError,
  WorkflowInstanceNotFoundError,
  WorkflowInvalidStateError,
  WorkflowOptimisticLockError,
  WorkflowTaskNotCompletableError,
  WorkflowTaskNotFoundError,
  WorkflowUnauthorizedTaskActionError,
} from '../../domain/errors/workflow.errors';
import {
  IWorkflowInstanceRepository,
  WorkflowInstanceRecord,
} from '../../domain/ports/workflow-instance.repository';
import { WORKFLOW_DEFINITION_PORT, IWorkflowDefinitionPort } from '../../domain/ports/workflow-definition.port';
import { IWorkflowInboxRepository } from '../../domain/ports/workflow-inbox.repository';
import { WORKFLOW_FORM_DATA_PORT, IWorkflowFormDataPort } from '../../domain/ports/workflow-form-data.port';
import { WORKFLOW_USER_RESOLUTION_PORT, IWorkflowUserResolutionPort } from '../../domain/ports/workflow-user-resolution.port';
import { StateMachineRunner } from '../../engine/state-machine.runner';
import { ContextProjectionService } from '../../engine/context-projection.service';
import { TokenManager } from '../../engine/token.manager';
import { EventLogService } from './event-log.service';
import { OutboxDispatcherService } from '../../engine/outbox-dispatcher.service';
import { IdempotencyService } from '../../engine/idempotency.service';
import { generateWorkflowInstanceId } from '../utilities/workflow-id.util';
import type { WorkflowDefinition } from '../../dsl/workflow-definition.schema';
import {
  WorkflowRequester,
  resolveWorkflowRequester,
} from '../../domain/models/workflow-requester';

export interface StartWorkflowParams {
  definitionId: string;
  definitionVersion?: number;
  name?: string;
  description?: string;
  context?: Record<string, unknown>;
  requester?: WorkflowRequester;
  initiatedById?: string | null;
  initiatedForId?: string | null;
  idempotencyKey?: string;
  correlationId?: string;
}

export interface CompleteUserTaskParams {
  taskId: string;
  userId: string;
  userPermissions: string[];
  formValues?: Record<string, unknown>;
  idempotencyKey?: string;
  correlationId?: string;
}

@Injectable()
export class WorkflowOrchestratorService {
  constructor(
    @Inject(IWorkflowInstanceRepository)
    private readonly instanceRepo: IWorkflowInstanceRepository,
    @Inject(WORKFLOW_DEFINITION_PORT)
    private readonly definitionPort: IWorkflowDefinitionPort,
    @Inject(IWorkflowInboxRepository)
    private readonly inboxRepo: IWorkflowInboxRepository,
    @Inject(WORKFLOW_FORM_DATA_PORT)
    private readonly formDataPort: IWorkflowFormDataPort,
    @Inject(WORKFLOW_USER_RESOLUTION_PORT)
    private readonly userResolution: IWorkflowUserResolutionPort,
    private readonly runner: StateMachineRunner,
    private readonly contextProjection: ContextProjectionService,
    private readonly tokenManager: TokenManager,
    private readonly eventLog: EventLogService,
    private readonly outboxDispatcher: OutboxDispatcherService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async startWorkflow(params: StartWorkflowParams): Promise<WorkflowInstanceRecord> {
    if (params.definitionId.endsWith('@draft')) {
      throw new WorkflowDefinitionDraftNotStartableError(params.definitionId);
    }

    if (params.idempotencyKey) {
      const existing = await this.idempotency.findByKey(params.idempotencyKey);
      if (existing?.result?.instanceId) {
        const instance = await this.instanceRepo.findById(existing.result.instanceId as string);
        if (instance) {
          return instance;
        }
      }
      await this.idempotency.requireFreshClaim({
        key: params.idempotencyKey,
        scope: 'startInstance',
      });
    }

    const definition = await this.loadDefinition(params.definitionId, params.definitionVersion);
    const start = definition.elements.find((e) => e.type === 'startEvent');
    if (!start) {
      throw new WorkflowInvalidStateError('Workflow definition is missing startEvent.');
    }

    const now = new Date();
    const resolved = resolveWorkflowRequester({
      requester: params.requester,
      initiatedById: params.initiatedById,
    });

    const instance = await this.instanceRepo.create({
      id: generateWorkflowInstanceId(),
      name: params.name ?? definition.name,
      definitionId: definition.id,
      definitionVersion: definition.version,
      description: params.description ?? definition.description ?? '',
      status: WorkflowInstanceStatus.Running,
      currentElementId: null,
      parentInstanceId: null,
      context: { ...(params.context ?? {}), definitionId: definition.id },
      compensationStack: [],
      initiatedById: resolved.initiatedById,
      initiatedForId: params.initiatedForId ?? null,
      delegated: false,
      isExtUser: resolved.isExtUser,
      extUserEmail: resolved.extUserEmail,
      completedAt: null,
      remarks: null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    });

    const ctx = this.runner.buildContext(definition, {
      actorType: 'user',
      actorId: resolved.initiatedById,
      correlationId: params.correlationId ?? null,
    });

    await this.eventLog.append({
      instanceId: instance.id,
      eventType: 'workflow.started',
      actorType: 'user',
      actorId: resolved.initiatedById,
      payload: { definitionId: definition.id, definitionVersion: definition.version },
      correlationId: params.correlationId,
    });

    const result = await this.runner.runToHalt(instance, start.id, ctx);
    const saved = await this.persistInstance(result.instance);

    if (params.idempotencyKey) {
      await this.idempotency.complete(params.idempotencyKey, { instanceId: saved.id });
    }

    return saved;
  }

  async completeUserTask(params: CompleteUserTaskParams): Promise<WorkflowInstanceRecord> {
    const task = await this.inboxRepo.findById(params.taskId);
    if (!task) {
      throw new WorkflowTaskNotFoundError(params.taskId);
    }

    const idempotencyKey =
      params.idempotencyKey ??
      `complete:${task.instanceId}:${task.elementId}:${params.userId}`;

    const existing = await this.idempotency.findByKey(idempotencyKey);
    if (existing?.result?.instanceId) {
      const cached = await this.instanceRepo.findById(existing.result.instanceId as string);
      if (cached) {
        return cached;
      }
    }

    await this.idempotency.requireFreshClaim({
      key: idempotencyKey,
      scope: 'completeTask',
      instanceId: task.instanceId,
    });

    const allowed = await this.userResolution.canUserActOnTask({
      userId: params.userId,
      userPermissions: params.userPermissions,
      instanceId: task.instanceId,
      elementId: task.elementId,
      assignedToId: task.assignedToId,
      candidateRoleNames: task.candidateRoleNames,
    });
    if (!allowed) {
      throw new WorkflowUnauthorizedTaskActionError(params.userId, params.taskId);
    }

    if (task.status !== InboxTaskStatus.Pending && task.status !== InboxTaskStatus.Claimed) {
      throw new WorkflowTaskNotCompletableError(params.taskId);
    }

    const instance = await this.instanceRepo.findByIdForUpdate(task.instanceId);
    if (!instance) {
      throw new WorkflowInstanceNotFoundError(task.instanceId);
    }

    if (instance.status !== WorkflowInstanceStatus.Running) {
      throw new WorkflowInvalidStateError(`Instance "${instance.id}" is not running.`);
    }

    let context = instance.context;
    if (params.formValues && task.formKey) {
      const snapshot = await this.formDataPort.saveFormData({
        instanceId: instance.id,
        elementId: task.elementId,
        formKey: task.formKey,
        values: params.formValues,
        submittedById: params.userId,
        submit: true,
      });
      context = this.contextProjection.mergeFormData(context, snapshot);
    } else if (params.formValues) {
      context = this.contextProjection.mergeFormData(context, params.formValues);
    }

    await this.inboxRepo.completeTask({
      taskId: params.taskId,
      completedById: params.userId,
      expectedStatus: task.status,
    });

    const definition = await this.loadDefinition(instance.definitionId, instance.definitionVersion);
    const ctx = this.runner.buildContext(definition, {
      actorType: 'user',
      actorId: params.userId,
      correlationId: params.correlationId ?? null,
    });

    let current: WorkflowInstanceRecord = { ...instance, context };
    const advance = await this.runner.completeElement(current, task.elementId, ctx);
    current = await this.persistInstance(advance.instance);

    await this.idempotency.complete(idempotencyKey, { instanceId: current.id });

    return current;
  }

  async claimTask(params: {
    taskId: string;
    userId: string;
    userPermissions: string[];
  }): Promise<WorkflowInstanceRecord> {
    const task = await this.inboxRepo.findById(params.taskId);
    if (!task) {
      throw new WorkflowTaskNotFoundError(params.taskId);
    }

    const allowed = await this.userResolution.canUserActOnTask({
      userId: params.userId,
      userPermissions: params.userPermissions,
      instanceId: task.instanceId,
      elementId: task.elementId,
      assignedToId: task.assignedToId,
      candidateRoleNames: task.candidateRoleNames,
    });
    if (!allowed) {
      throw new WorkflowUnauthorizedTaskActionError(params.userId, params.taskId);
    }

    await this.inboxRepo.claimTask({
      taskId: params.taskId,
      claimedById: params.userId,
      expectedStatus: InboxTaskStatus.Pending,
    });

    const instance = await this.instanceRepo.findById(task.instanceId);
    if (!instance) {
      throw new WorkflowInstanceNotFoundError(task.instanceId);
    }
    return instance;
  }

  async delegateTask(params: {
    taskId: string;
    fromUserId: string;
    toUserId: string;
    userPermissions: string[];
  }): Promise<WorkflowInstanceRecord> {
    const task = await this.inboxRepo.findById(params.taskId);
    if (!task) {
      throw new WorkflowTaskNotFoundError(params.taskId);
    }

    const allowed = await this.userResolution.canUserActOnTask({
      userId: params.fromUserId,
      userPermissions: params.userPermissions,
      instanceId: task.instanceId,
      elementId: task.elementId,
      assignedToId: task.assignedToId,
      candidateRoleNames: task.candidateRoleNames,
    });
    if (!allowed) {
      throw new WorkflowUnauthorizedTaskActionError(params.fromUserId, params.taskId);
    }

    const updatedTask = {
      ...task,
      assignedToId: params.toUserId,
      status: InboxTaskStatus.Pending,
      claimedAt: null,
      claimedById: null,
      updatedAt: new Date(),
    };
    await this.inboxRepo.update(task.id, updatedTask);

    const instance = await this.instanceRepo.findById(task.instanceId);
    if (!instance) {
      throw new WorkflowInstanceNotFoundError(task.instanceId);
    }

    await this.eventLog.append({
      instanceId: instance.id,
      eventType: 'workflow.task.delegated',
      elementId: task.elementId,
      actorType: 'user',
      actorId: params.fromUserId,
      payload: { toUserId: params.toUserId },
    });

    return { ...instance, delegated: true };
  }

  async cancelWorkflow(params: {
    instanceId: string;
    actorId?: string | null;
    remarks?: string;
  }): Promise<WorkflowInstanceRecord> {
    const instance = await this.instanceRepo.findByIdForUpdate(params.instanceId);
    if (!instance) {
      throw new WorkflowInstanceNotFoundError(params.instanceId);
    }

    if (
      instance.status === WorkflowInstanceStatus.Completed ||
      instance.status === WorkflowInstanceStatus.Cancelled
    ) {
      throw new WorkflowInvalidStateError(`Instance "${instance.id}" cannot be cancelled.`);
    }

    await this.tokenManager.cancelAll(instance.id);

    const cancelled = await this.persistInstance({
      ...instance,
      status: WorkflowInstanceStatus.Cancelled,
      remarks: params.remarks ?? instance.remarks,
      completedAt: new Date(),
    });

    await this.eventLog.append({
      instanceId: cancelled.id,
      eventType: 'workflow.cancelled',
      actorType: 'user',
      actorId: params.actorId ?? null,
      payload: { remarks: params.remarks ?? null },
    });

    await this.outboxDispatcher.write({
      instanceId: cancelled.id,
      eventType: 'workflow.cancelled',
      payload: { remarks: params.remarks ?? null },
    });

    return cancelled;
  }

  async completeServiceTask(params: {
    instanceId: string;
    elementId: string;
    output?: Record<string, unknown>;
    correlationId?: string;
  }): Promise<WorkflowInstanceRecord> {
    const instance = await this.instanceRepo.findByIdForUpdate(params.instanceId);
    if (!instance) {
      throw new WorkflowInstanceNotFoundError(params.instanceId);
    }

    const definition = await this.loadDefinition(instance.definitionId, instance.definitionVersion);
    const ctx = this.runner.buildContext(definition, {
      actorType: 'service',
      correlationId: params.correlationId ?? null,
    });

    let current = instance;
    if (params.output) {
      current = {
        ...current,
        context: this.contextProjection.mergeFormData(current.context, params.output),
      };
    }

    const advance = await this.runner.completeElement(current, params.elementId, ctx);
    return this.persistInstance(advance.instance);
  }

  async forceSkipElement(params: {
    instanceId: string;
    elementId: string;
    actorId?: string | null;
  }): Promise<WorkflowInstanceRecord> {
    const instance = await this.instanceRepo.findByIdForUpdate(params.instanceId);
    if (!instance) {
      throw new WorkflowInstanceNotFoundError(params.instanceId);
    }

    const definition = await this.loadDefinition(instance.definitionId, instance.definitionVersion);
    const ctx = this.runner.buildContext(definition, {
      actorType: 'user',
      actorId: params.actorId ?? null,
    });

    await this.eventLog.append({
      instanceId: instance.id,
      eventType: 'workflow.element.force_skipped',
      elementId: params.elementId,
      actorType: 'user',
      actorId: params.actorId ?? null,
      payload: {},
    });

    const advance = await this.runner.advanceFrom(instance, params.elementId, ctx);
    return this.persistInstance(advance.instance);
  }

  async getInstance(instanceId: string): Promise<WorkflowInstanceRecord> {
    const instance = await this.instanceRepo.findById(instanceId);
    if (!instance) {
      throw new WorkflowInstanceNotFoundError(instanceId);
    }
    return instance;
  }

  private async loadDefinition(
    definitionId: string,
    version?: number,
  ): Promise<WorkflowDefinition> {
    const definition = await this.definitionPort.getDefinition(definitionId, version);
    if (!definition) {
      throw new WorkflowDefinitionNotFoundError(definitionId, version);
    }
    return definition;
  }

  private async persistInstance(
    instance: WorkflowInstanceRecord,
  ): Promise<WorkflowInstanceRecord> {
    try {
      return await this.instanceRepo.updateWithVersion(instance.id, instance.version, {
        status: instance.status,
        currentElementId: instance.currentElementId,
        context: instance.context,
        compensationStack: instance.compensationStack,
        completedAt: instance.completedAt,
        remarks: instance.remarks,
      });
    } catch {
      throw new WorkflowOptimisticLockError(instance.id);
    }
  }
}
