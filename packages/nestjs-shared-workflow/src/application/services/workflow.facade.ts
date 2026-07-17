import { Injectable } from '@nestjs/common';
import type { WorkflowInstanceRecord } from '../../domain/ports/workflow-instance.repository';
import type { WorkflowInboxTaskRecord } from '../../domain/ports/workflow-inbox.repository';
import type { WorkflowEventLogEntry } from '../../domain/ports/workflow-event-log.repository';
import {
  WorkflowOrchestratorService,
  StartWorkflowParams,
  CompleteUserTaskParams,
} from './workflow-orchestrator.service';
import { EventLogService } from './event-log.service';
import { IWorkflowInboxRepository } from '../../domain/ports/workflow-inbox.repository';
import { Inject } from '@nestjs/common';

@Injectable()
export class WorkflowFacade {
  constructor(
    private readonly orchestrator: WorkflowOrchestratorService,
    private readonly eventLog: EventLogService,
    @Inject(IWorkflowInboxRepository)
    private readonly inboxRepo: IWorkflowInboxRepository,
  ) {}

  startWorkflow(params: StartWorkflowParams): Promise<WorkflowInstanceRecord> {
    return this.orchestrator.startWorkflow(params);
  }

  cancelWorkflow(params: {
    instanceId: string;
    actorId?: string | null;
    remarks?: string;
  }): Promise<WorkflowInstanceRecord> {
    return this.orchestrator.cancelWorkflow(params);
  }

  getInstance(instanceId: string): Promise<WorkflowInstanceRecord> {
    return this.orchestrator.getInstance(instanceId);
  }

  completeUserTask(params: CompleteUserTaskParams): Promise<WorkflowInstanceRecord> {
    return this.orchestrator.completeUserTask(params);
  }

  claimTask(params: {
    taskId: string;
    userId: string;
    userPermissions: string[];
  }): Promise<WorkflowInstanceRecord> {
    return this.orchestrator.claimTask(params);
  }

  delegateTask(params: {
    taskId: string;
    fromUserId: string;
    toUserId: string;
    userPermissions: string[];
  }): Promise<WorkflowInstanceRecord> {
    return this.orchestrator.delegateTask(params);
  }

  getMyInbox(userId: string): Promise<WorkflowInboxTaskRecord[]> {
    return this.inboxRepo.findOpenForUser(userId);
  }

  getTimeline(
    instanceId: string,
    options?: { fromSequence?: number; limit?: number },
  ): Promise<WorkflowEventLogEntry[]> {
    return this.eventLog.getTimeline(instanceId, options);
  }
}
