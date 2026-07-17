export const WORKFLOW_QUEUE_PORT = Symbol('IWorkflowQueuePort');

export type WorkflowQueueJobType = 'serviceTask' | 'outboxDispatch' | 'slaEscalation';

export interface WorkflowQueueJobPayload {
  instanceId: string;
  elementId: string;
  handler?: string;
  input?: Record<string, unknown>;
  correlationId?: string;
}

export interface IWorkflowQueuePort {
  /**
   * Enqueue asynchronous workflow work (service tasks, outbox dispatch, SLA checks).
   *
   * @param jobType     Routing key consumed by the workflow worker.
   * @param payload     Job data forwarded to the processor.
   * @param options     Optional deduplication and scheduling hints.
   */
  enqueue(
    jobType: WorkflowQueueJobType,
    payload: WorkflowQueueJobPayload,
    options?: {
      /** Stable idempotency seed — duplicate enqueues within the dedup window are ignored. */
      dedupeKey?: string;
      /** Delay execution until this timestamp. */
      runAt?: Date;
      /** Maximum retry attempts on failure. */
      maxAttempts?: number;
    },
  ): Promise<{ id: string }>;
}
