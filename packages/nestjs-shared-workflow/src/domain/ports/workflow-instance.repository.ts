import { IRepository } from '@ce/nestjs-shared-core';
import { WorkflowInstanceStatus } from '../enums/workflow-instance-status.enum';

export interface WorkflowInstanceRecord {
  id: string;
  name: string;
  definitionId: string;
  definitionVersion: number;
  description: string;
  status: WorkflowInstanceStatus;
  currentElementId: string | null;
  parentInstanceId: string | null;
  context: Record<string, unknown>;
  compensationStack: unknown[];
  initiatedById: string | null;
  initiatedForId: string | null;
  delegated: boolean;
  isExtUser: boolean;
  extUserEmail: string | null;
  completedAt: Date | null;
  remarks: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInstanceFilter {
  definitionId?: string;
  status?: WorkflowInstanceStatus;
  initiatedForId?: string;
  parentInstanceId?: string;
}

export const IWorkflowInstanceRepository = Symbol('IWorkflowInstanceRepository');

export interface IWorkflowInstanceRepository
  extends IRepository<WorkflowInstanceRecord, string, WorkflowInstanceFilter> {
  findByIdForUpdate(id: string): Promise<WorkflowInstanceRecord | null>;

  updateWithVersion(
    id: string,
    expectedVersion: number,
    patch: Partial<
      Pick<
        WorkflowInstanceRecord,
        | 'status'
        | 'currentElementId'
        | 'context'
        | 'compensationStack'
        | 'completedAt'
        | 'remarks'
      >
    >,
  ): Promise<WorkflowInstanceRecord>;

  findActiveByInitiatedFor(initiatedForId: string): Promise<WorkflowInstanceRecord[]>;
}
