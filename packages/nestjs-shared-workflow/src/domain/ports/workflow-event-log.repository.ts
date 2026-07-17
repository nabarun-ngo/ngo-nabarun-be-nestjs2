export interface WorkflowEventLogEntry {
  id: string;
  instanceId: string;
  sequence: number;
  eventType: string;
  elementId: string | null;
  actorType: 'system' | 'user' | 'service';
  actorId: string | null;
  payload: Record<string, unknown>;
  correlationId: string | null;
  occurredAt: Date;
}

export interface AppendWorkflowEventInput {
  instanceId: string;
  eventType: string;
  elementId?: string | null;
  actorType: WorkflowEventLogEntry['actorType'];
  actorId?: string | null;
  payload?: Record<string, unknown>;
  correlationId?: string | null;
  occurredAt?: Date;
}

export const IWorkflowEventLogRepository = Symbol('IWorkflowEventLogRepository');

export interface IWorkflowEventLogRepository {
  append(input: AppendWorkflowEventInput): Promise<WorkflowEventLogEntry>;

  appendMany(inputs: AppendWorkflowEventInput[]): Promise<WorkflowEventLogEntry[]>;

  findByInstance(
    instanceId: string,
    options?: { fromSequence?: number; limit?: number },
  ): Promise<WorkflowEventLogEntry[]>;

  getLatestSequence(instanceId: string): Promise<number>;
}
