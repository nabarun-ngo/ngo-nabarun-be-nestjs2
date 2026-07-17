import { z } from 'zod';

export const WorkflowModuleOptionsSchema = z.object({
  /**
   * IANA timezone used for SLA deadlines and scheduled workflow actions
   * (e.g. "Asia/Kolkata", "America/New_York"). Defaults to `"UTC"`.
   */
  defaultTimezone: z.string().optional().default('UTC'),

  /**
   * TTL for idempotency keys stored by the runtime. Default: 24 hours.
   */
  idempotencyTtlMs: z
    .number()
    .int()
    .positive()
    .optional()
    .default(86_400_000),

  /**
   * Maximum outbox events dispatched per poll cycle. Default: 50.
   */
  outboxDispatchBatchSize: z
    .number()
    .int()
    .positive()
    .optional()
    .default(50),

  /**
   * Retry budget for failed service-task queue dispatches. Default: 3.
   */
  serviceTaskMaxRetries: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(3),
});

export type WorkflowModuleOptions = z.input<typeof WorkflowModuleOptionsSchema>;
