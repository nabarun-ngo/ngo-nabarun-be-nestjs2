export type WorkflowIdempotencyScope =
  | 'startInstance'
  | 'completeTask'
  | 'signalInstance'
  | 'serviceTask';

export interface WorkflowIdempotencyRecord {
  key: string;
  scope: WorkflowIdempotencyScope;
  instanceId: string | null;
  result: Record<string, unknown> | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface WorkflowIdempotencyClaimInput {
  key: string;
  scope: WorkflowIdempotencyScope;
  instanceId?: string | null;
  ttlMs: number;
}

export const IWorkflowIdempotencyRepository = Symbol('IWorkflowIdempotencyRepository');

export interface IWorkflowIdempotencyRepository {
  /**
   * Atomically claim an idempotency key. Returns the existing record when the
   * key is already present and not expired; otherwise creates a new claim.
   */
  claim(input: WorkflowIdempotencyClaimInput): Promise<{
    claimed: boolean;
    record: WorkflowIdempotencyRecord;
  }>;

  complete(
    key: string,
    result: Record<string, unknown>,
  ): Promise<WorkflowIdempotencyRecord>;

  findByKey(key: string): Promise<WorkflowIdempotencyRecord | null>;

  purgeExpired(before?: Date): Promise<number>;
}
