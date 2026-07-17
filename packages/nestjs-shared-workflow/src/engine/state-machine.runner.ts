import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  SequenceFlow,
  WorkflowDefinition,
  WorkflowElement,
} from '../dsl/workflow-definition.schema';
import { WorkflowInstanceStatus } from '../domain/enums/workflow-instance-status.enum';
import { InboxTaskStatus } from '../domain/enums/inbox-task-status.enum';
import {
  WorkflowElementNotFoundError,
  WorkflowInvalidStateError,
} from '../domain/errors/workflow.errors';
import type { WorkflowInstanceRecord } from '../domain/ports/workflow-instance.repository';
import { IWorkflowInboxRepository } from '../domain/ports/workflow-inbox.repository';
import { WORKFLOW_USER_RESOLUTION_PORT, IWorkflowUserResolutionPort } from '../domain/ports/workflow-user-resolution.port';
import { WORKFLOW_QUEUE_PORT, IWorkflowQueuePort } from '../domain/ports/workflow-queue.port';
import { WORKFLOW_DEFINITION_PORT, IWorkflowDefinitionPort } from '../domain/ports/workflow-definition.port';
import { WorkflowTokenRecord } from '../domain/ports/workflow-token.repository';
import { ContextProjectionService } from './context-projection.service';
import { TransitionRouter, WorkflowGraphIndex } from './transition.router';
import { TokenManager } from './token.manager';
import { TimerScheduler } from './timer.scheduler';
import { EventLogService } from '../application/services/event-log.service';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { generateWorkflowInstanceId } from '../application/utilities/workflow-id.util';

export interface RunnerContext {
  definition: WorkflowDefinition;
  graph: WorkflowGraphIndex;
  actorType: 'system' | 'user' | 'service';
  actorId?: string | null;
  correlationId?: string | null;
}

export interface AdvanceResult {
  instance: WorkflowInstanceRecord;
  halted: boolean;
  haltReason?: 'userTask' | 'serviceTask' | 'subProcess' | 'join' | 'completed';
}

@Injectable()
export class StateMachineRunner {
  private readonly logger = new Logger(StateMachineRunner.name);

  constructor(
    private readonly transitionRouter: TransitionRouter,
    private readonly contextProjection: ContextProjectionService,
    private readonly tokenManager: TokenManager,
    private readonly timerScheduler: TimerScheduler,
    private readonly eventLog: EventLogService,
    private readonly outboxDispatcher: OutboxDispatcherService,
    @Inject(IWorkflowInboxRepository)
    private readonly inboxRepo: IWorkflowInboxRepository,
    @Inject(WORKFLOW_USER_RESOLUTION_PORT)
    private readonly userResolution: IWorkflowUserResolutionPort,
    @Inject(WORKFLOW_QUEUE_PORT)
    private readonly queuePort: IWorkflowQueuePort,
    @Inject(WORKFLOW_DEFINITION_PORT)
    private readonly definitionPort: IWorkflowDefinitionPort,
  ) {}

  buildContext(definition: WorkflowDefinition, partial?: Partial<RunnerContext>): RunnerContext {
    return {
      definition,
      graph: this.transitionRouter.buildIndex(definition),
      actorType: partial?.actorType ?? 'system',
      actorId: partial?.actorId ?? null,
      correlationId: partial?.correlationId ?? null,
    };
  }

  async enterElement(
    instance: WorkflowInstanceRecord,
    elementId: string,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<WorkflowInstanceRecord> {
    const element = this.getElement(ctx.graph, elementId);

    await this.eventLog.append({
      instanceId: instance.id,
      eventType: 'element.entered',
      elementId,
      actorType: ctx.actorType,
      actorId: ctx.actorId,
      payload: { tokenId: token?.id ?? null },
      correlationId: ctx.correlationId,
    });

    instance = {
      ...instance,
      currentElementId: elementId,
    };

    switch (element.type) {
      case 'startEvent':
        return instance;
      case 'userTask':
        return this.enterUserTask(instance, element, ctx);
      case 'serviceTask':
        return this.enterServiceTask(instance, element, ctx);
      case 'exclusiveGateway':
      case 'parallelGateway':
      case 'inclusiveGateway':
        return instance;
      case 'subProcess':
        return this.enterSubProcess(instance, element, ctx);
      case 'endEvent':
        return instance;
      default:
        return instance;
    }
  }

  async completeElement(
    instance: WorkflowInstanceRecord,
    elementId: string,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<AdvanceResult> {
    const element = this.getElement(ctx.graph, elementId);

    await this.eventLog.append({
      instanceId: instance.id,
      eventType: 'element.completed',
      elementId,
      actorType: ctx.actorType,
      actorId: ctx.actorId,
      payload: { tokenId: token?.id ?? null },
      correlationId: ctx.correlationId,
    });

    if (element.type === 'endEvent') {
      return this.handleEndEvent(instance, element, ctx, token);
    }

    return this.advanceFrom(instance, elementId, ctx, token);
  }

  async advanceFrom(
    instance: WorkflowInstanceRecord,
    elementId: string,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<AdvanceResult> {
    const element = this.getElement(ctx.graph, elementId);
    const outgoing = this.transitionRouter.getOutgoingFlows(ctx.graph, elementId);

    if (element.type === 'exclusiveGateway') {
      const selected = this.transitionRouter.selectExclusiveFlow(outgoing, instance.context);
      return this.followFlow(instance, selected, ctx, token);
    }

    if (element.type === 'parallelGateway') {
      const gateway = element;
      if (gateway.gatewayDirection === 'join') {
        return this.handleParallelJoin(instance, elementId, ctx, token);
      }
      const selected = this.transitionRouter.selectParallelFlows(outgoing);
      return this.handleParallelFork(instance, elementId, selected, ctx);
    }

    if (element.type === 'inclusiveGateway') {
      const gateway = element;
      if (gateway.gatewayDirection === 'join') {
        return this.handleInclusiveJoin(instance, elementId, ctx, token);
      }
      const selected = this.transitionRouter.selectInclusiveFlows(outgoing, instance.context);
      return this.handleInclusiveFork(instance, elementId, selected, ctx);
    }

    if (outgoing.length === 0) {
      if (element.type === 'userTask' || element.type === 'serviceTask') {
        return { instance, halted: true, haltReason: element.type === 'userTask' ? 'userTask' : 'serviceTask' };
      }
      throw new WorkflowInvalidStateError(`Element "${elementId}" has no outgoing flows.`);
    }

    const selected =
      outgoing.length === 1
        ? outgoing[0]
        : this.transitionRouter.selectExclusiveFlow(outgoing, instance.context);

    return this.followFlow(instance, selected, ctx, token);
  }

  async runToHalt(
    instance: WorkflowInstanceRecord,
    elementId: string,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<AdvanceResult> {
    let current = await this.enterElement(instance, elementId, ctx, token);
    const element = this.getElement(ctx.graph, elementId);

    if (element.type === 'userTask' || element.type === 'serviceTask') {
      return {
        instance: current,
        halted: true,
        haltReason: element.type === 'userTask' ? 'userTask' : 'serviceTask',
      };
    }

    if (element.type === 'subProcess' && current.status === WorkflowInstanceStatus.Running) {
      const sub = this.getElement(ctx.graph, elementId);
      if (sub.type === 'subProcess' && sub.definitionId && !sub.embedded) {
        return { instance: current, halted: true, haltReason: 'subProcess' };
      }
    }

    return this.completeElement(current, elementId, ctx, token);
  }

  private async followFlow(
    instance: WorkflowInstanceRecord,
    flow: SequenceFlow,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<AdvanceResult> {
    if (token) {
      await this.tokenManager.moveToken(token, flow.targetRef);
    }

    let current = instance;
    let nextElementId = flow.targetRef;

    while (true) {
      const result = await this.runToHalt(current, nextElementId, ctx, token);
      current = result.instance;

      if (result.halted) {
        return result;
      }

      if (current.status === WorkflowInstanceStatus.Completed) {
        return { instance: current, halted: true, haltReason: 'completed' };
      }

      const completedElement = this.getElement(ctx.graph, nextElementId);
      if (
        completedElement.type === 'exclusiveGateway' ||
        (completedElement.type === 'parallelGateway' && completedElement.gatewayDirection !== 'join') ||
        (completedElement.type === 'inclusiveGateway' && completedElement.gatewayDirection !== 'join')
      ) {
        const advance = await this.advanceFrom(current, nextElementId, ctx, token);
        if (advance.halted) {
          return advance;
        }
        current = advance.instance;
        if (advance.haltReason === 'completed') {
          return advance;
        }
        nextElementId = current.currentElementId!;
        continue;
      }

      nextElementId = current.currentElementId!;
      if (!nextElementId) {
        return { instance: current, halted: true };
      }
    }
  }

  private async enterUserTask(
    instance: WorkflowInstanceRecord,
    element: Extract<WorkflowElement, { type: 'userTask' }>,
    ctx: RunnerContext,
  ): Promise<WorkflowInstanceRecord> {
    let assignedToId: string | null = null;
    if (element.assigneeExpression) {
      const assignee = await this.userResolution.resolveAssigneeExpression({
        expression: element.assigneeExpression,
        instanceId: instance.id,
        elementId: element.id,
        context: instance.context,
      });
      assignedToId = assignee?.userId ?? null;
    }

    const candidateRoleNames = element.candidateRoles ?? [];

    await this.inboxRepo.create({
      id: `${instance.id}:${element.id}`,
      instanceId: instance.id,
      elementId: element.id,
      workflowType: ctx.definition.id,
      formKey: element.formKey ?? null,
      status: InboxTaskStatus.Pending,
      assignedToId,
      candidateRoleNames,
      slaDeadlineAt: null,
      claimedAt: null,
      claimedById: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (element.slaHours) {
      const deadline = await this.timerScheduler.scheduleSlaDeadline({
        instanceId: instance.id,
        elementId: element.id,
        slaHours: element.slaHours,
        correlationId: ctx.correlationId ?? undefined,
      });
      void deadline;
    }

    await this.outboxDispatcher.write({
      instanceId: instance.id,
      eventType: 'workflow.task.created',
      payload: { elementId: element.id, formKey: element.formKey ?? null },
    });

    return { ...instance, currentElementId: element.id };
  }

  private async enterServiceTask(
    instance: WorkflowInstanceRecord,
    element: Extract<WorkflowElement, { type: 'serviceTask' }>,
    ctx: RunnerContext,
  ): Promise<WorkflowInstanceRecord> {
    const input = this.contextProjection.projectServiceTaskInput(
      instance.context,
      element.inputMapping,
    );

    await this.queuePort.enqueue(
      'serviceTask',
      {
        instanceId: instance.id,
        elementId: element.id,
        handler: element.handler,
        input,
        correlationId: ctx.correlationId ?? undefined,
      },
      {
        dedupeKey: `service:${instance.id}:${element.id}`,
      },
    );

    return { ...instance, currentElementId: element.id };
  }

  private async enterSubProcess(
    instance: WorkflowInstanceRecord,
    element: Extract<WorkflowElement, { type: 'subProcess' }>,
    ctx: RunnerContext,
  ): Promise<WorkflowInstanceRecord> {
    const embeddedDefinition =
      element.embedded ??
      (element.definitionId
        ? await this.definitionPort.getDefinition(
            element.definitionId,
            element.definitionVersion,
          )
        : null);

    if (!embeddedDefinition) {
      throw new WorkflowInvalidStateError(
        `Sub-process "${element.id}" has no resolvable definition.`,
      );
    }

    if (element.embedded) {
      const childCtx = this.buildContext(embeddedDefinition, ctx);
      const start = embeddedDefinition.elements.find((e) => e.type === 'startEvent');
      if (!start) {
        throw new WorkflowInvalidStateError('Embedded sub-process missing startEvent.');
      }
      const childInstance: WorkflowInstanceRecord = {
        ...instance,
        definitionId: embeddedDefinition.id,
        definitionVersion: embeddedDefinition.version,
        context: { ...instance.context },
      };
      const result = await this.runToHalt(childInstance, start.id, childCtx);
      return {
        ...instance,
        context: result.instance.context,
        currentElementId: element.id,
      };
    }

    await this.outboxDispatcher.write({
      instanceId: instance.id,
      eventType: 'workflow.subprocess.started',
      payload: {
        elementId: element.id,
        childDefinitionId: element.definitionId,
        childDefinitionVersion: element.definitionVersion ?? null,
        childInstanceId: generateWorkflowInstanceId(),
      },
    });

    return { ...instance, currentElementId: element.id };
  }

  private async handleEndEvent(
    instance: WorkflowInstanceRecord,
    element: Extract<WorkflowElement, { type: 'endEvent' }>,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<AdvanceResult> {
    if (element.terminateAll) {
      await this.tokenManager.cancelAll(instance.id);
      const completed: WorkflowInstanceRecord = {
        ...instance,
        status: WorkflowInstanceStatus.Completed,
        completedAt: new Date(),
        currentElementId: element.id,
      };
      await this.outboxDispatcher.write({
        instanceId: instance.id,
        eventType: 'workflow.completed',
        payload: { elementId: element.id, terminateAll: true },
      });
      return { instance: completed, halted: true, haltReason: 'completed' };
    }

    if (token) {
      await this.tokenManager.consume(token);
    }

    const active = await this.tokenManager.getActiveTokens(instance.id);
    if (active.length === 0) {
      const completed: WorkflowInstanceRecord = {
        ...instance,
        status: WorkflowInstanceStatus.Completed,
        completedAt: new Date(),
        currentElementId: element.id,
      };
      await this.outboxDispatcher.write({
        instanceId: instance.id,
        eventType: 'workflow.completed',
        payload: { elementId: element.id },
      });
      return { instance: completed, halted: true, haltReason: 'completed' };
    }

    return { instance, halted: true, haltReason: 'completed' };
  }

  private async handleParallelFork(
    instance: WorkflowInstanceRecord,
    gatewayId: string,
    flows: SequenceFlow[],
    ctx: RunnerContext,
  ): Promise<AdvanceResult> {
    const tokens = await this.tokenManager.fork(
      instance.id,
      gatewayId,
      flows.map((f) => f.targetRef),
    );

    let current = instance;
    let halted: AdvanceResult | null = null;

    for (let i = 0; i < flows.length; i++) {
      const result = await this.runToHalt(current, flows[i].targetRef, ctx, tokens[i]);
      current = result.instance;
      if (result.halted && result.haltReason !== 'completed') {
        halted = result;
      }
    }

    if (halted) {
      return halted;
    }

    return { instance: current, halted: false };
  }

  private async handleParallelJoin(
    instance: WorkflowInstanceRecord,
    gatewayId: string,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<AdvanceResult> {
    if (token) {
      await this.tokenManager.markWaiting(token);
    }

    const incoming = this.transitionRouter.getIncomingFlows(ctx.graph, gatewayId);
    const complete = await this.tokenManager.isJoinComplete(
      instance.id,
      gatewayId,
      incoming.length,
    );

    if (!complete) {
      return { instance, halted: true, haltReason: 'join' };
    }

    const tokens = await this.tokenManager.getTokensAtElement(instance.id, gatewayId);
    for (const t of tokens) {
      await this.tokenManager.consume(t);
    }

    const outgoing = this.transitionRouter.getOutgoingFlows(ctx.graph, gatewayId);
    if (outgoing.length !== 1) {
      throw new WorkflowInvalidStateError(
        `Parallel join gateway "${gatewayId}" must have exactly one outgoing flow.`,
      );
    }

    return this.followFlow(instance, outgoing[0], ctx);
  }

  private async handleInclusiveFork(
    instance: WorkflowInstanceRecord,
    gatewayId: string,
    flows: SequenceFlow[],
    ctx: RunnerContext,
  ): Promise<AdvanceResult> {
    return this.handleParallelFork(instance, gatewayId, flows, ctx);
  }

  private async handleInclusiveJoin(
    instance: WorkflowInstanceRecord,
    gatewayId: string,
    ctx: RunnerContext,
    token?: WorkflowTokenRecord,
  ): Promise<AdvanceResult> {
    return this.handleParallelJoin(instance, gatewayId, ctx, token);
  }

  private getElement(graph: WorkflowGraphIndex, elementId: string): WorkflowElement {
    const element = graph.elementsById.get(elementId);
    if (!element) {
      throw new WorkflowElementNotFoundError(elementId);
    }
    return element;
  }
}
