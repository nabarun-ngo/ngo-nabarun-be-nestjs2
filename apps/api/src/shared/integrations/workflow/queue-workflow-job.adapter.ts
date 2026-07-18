import { Injectable } from '@nestjs/common';
import {
  EscalationJob,
  IWorkflowQueuePort,
  OutboxDispatchJob,
  ProcessServiceTaskJob,
  WORKFLOW_QUEUE_PORT,
  WorkflowQueueJobPayload,
  WorkflowQueueJobType,
  WorkflowTimerJob,
} from '@nabarun-ngo/nestjs-shared-workflow';
import { QueueProcessingService } from '@nabarun-ngo/nestjs-shared-queue';

const JOB_NAME_BY_TYPE: Record<WorkflowQueueJobType, string> = {
  serviceTask: ProcessServiceTaskJob.name,
  outboxDispatch: OutboxDispatchJob.name,
  slaEscalation: EscalationJob.name,
};

@Injectable()
export class QueueWorkflowJobAdapter implements IWorkflowQueuePort {
  constructor(private readonly queueProcessing: QueueProcessingService) { }

  async enqueue(
    jobType: WorkflowQueueJobType,
    payload: WorkflowQueueJobPayload,
    options?: {
      dedupeKey?: string;
      runAt?: Date;
      maxAttempts?: number;
    },
  ): Promise<{ id: string }> {
    const jobName = JOB_NAME_BY_TYPE[jobType];
    const jobId =
      options?.dedupeKey ??
      `${payload.instanceId}:${payload.elementId}:${jobType}`;

    const jobOptions: {
      jobId: string;
      attempts?: number;
      delay?: number;
    } = { jobId };

    if (options?.maxAttempts != null) {
      jobOptions.attempts = options.maxAttempts;
    }

    if (options?.runAt) {
      jobOptions.delay = Math.max(0, options.runAt.getTime() - Date.now());
    }

    const job = await this.queueProcessing.addJob(
      jobName,
      { payload },
      jobOptions,
    );
    return { id: job.id! };
  }

  /** Schedule an SLA timer (WorkflowTimerJob) before escalation. */
  async enqueueTimer(
    payload: WorkflowQueueJobPayload,
    options?: { dedupeKey?: string; runAt?: Date },
  ): Promise<{ id: string }> {
    const jobId =
      options?.dedupeKey ?? `timer:${payload.instanceId}:${payload.elementId}`;

    const jobOptions: {
      jobId: string;
      delay?: number;
    } = { jobId };

    if (options?.runAt) {
      jobOptions.delay = Math.max(0, options.runAt.getTime() - Date.now());
    }

    const job = await this.queueProcessing.addJob(
      WorkflowTimerJob.name,
      { payload },
      jobOptions,
    );
    return { id: job.id! };
  }
}

export const WORKFLOW_QUEUE_PROVIDER = {
  provide: WORKFLOW_QUEUE_PORT,
  useClass: QueueWorkflowJobAdapter,
};
