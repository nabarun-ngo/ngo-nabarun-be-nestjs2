import { IRepository } from '@nabarun-ngo/nestjs-shared-core';
import { InboxTaskStatus } from '../enums/inbox-task-status.enum';

export interface WorkflowInboxTaskRecord {
  id: string;
  instanceId: string;
  elementId: string;
  workflowType: string;
  formKey: string | null;
  status: InboxTaskStatus;
  assignedToId: string | null;
  candidateRoleNames: string[];
  slaDeadlineAt: Date | null;
  claimedAt: Date | null;
  claimedById: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInboxFilter {
  assignedToId?: string;
  status?: InboxTaskStatus;
  instanceId?: string;
  workflowType?: string;
  overdueBefore?: Date;
}

export const IWorkflowInboxRepository = Symbol('IWorkflowInboxRepository');

export interface IWorkflowInboxRepository
  extends IRepository<WorkflowInboxTaskRecord, string, WorkflowInboxFilter> {
  findByInstanceAndElement(
    instanceId: string,
    elementId: string,
  ): Promise<WorkflowInboxTaskRecord | null>;

  findOpenForUser(userId: string): Promise<WorkflowInboxTaskRecord[]>;

  claimTask(params: {
    taskId: string;
    claimedById: string;
    expectedStatus: InboxTaskStatus;
  }): Promise<WorkflowInboxTaskRecord>;

  completeTask(params: {
    taskId: string;
    completedById: string;
    expectedStatus: InboxTaskStatus;
  }): Promise<WorkflowInboxTaskRecord>;
}
