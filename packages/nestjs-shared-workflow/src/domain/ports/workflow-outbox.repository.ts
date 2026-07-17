export enum WorkflowOutboxStatus {
  Pending = 'pending',
  Dispatched = 'dispatched',
  Failed = 'failed',
}

export interface WorkflowOutboxRecord {
  id: string;
  instanceId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: WorkflowOutboxStatus;
  createdAt: Date;
  dispatchedAt: Date | null;
  lastError: string | null;
}

export interface CreateWorkflowOutboxInput {
  instanceId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export const IWorkflowOutboxRepository = Symbol('IWorkflowOutboxRepository');

export interface IWorkflowOutboxRepository {
  create(input: CreateWorkflowOutboxInput): Promise<WorkflowOutboxRecord>;

  findPendingBatch(limit: number): Promise<WorkflowOutboxRecord[]>;

  markDispatched(id: string, dispatchedAt?: Date): Promise<void>;

  markFailed(id: string, error: string): Promise<void>;
}
