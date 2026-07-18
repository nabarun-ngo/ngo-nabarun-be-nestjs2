import { Inject, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@nabarun-ngo/nestjs-shared-queue';
import { OutboxDispatchJob } from '../../application/jobs/outbox-dispatch.job';
import { IWorkflowOutboxRepository } from '../../domain/ports/workflow-outbox.repository';
import { WORKFLOW_OPTIONS } from '../workflow-options.token';
import type { WorkflowModuleOptions } from '../../workflow.schema';

@QueueHandler(OutboxDispatchJob, { attempts: 3 })
export class OutboxDispatchHandler implements IQueueHandler<OutboxDispatchJob> {
  private readonly logger = new Logger(OutboxDispatchHandler.name);

  constructor(
    @Inject(IWorkflowOutboxRepository)
    private readonly outboxRepo: IWorkflowOutboxRepository,
    @Inject(WORKFLOW_OPTIONS)
    private readonly options: WorkflowModuleOptions,
  ) { }

  async execute(job: Job<OutboxDispatchJob>, _ctx: JobExecutionContext): Promise<void> {
    const raw = job.data as { payload?: { batchSize?: number }; batchSize?: number };
    const batchSize =
      raw.payload?.batchSize ?? raw.batchSize ?? this.options.outboxDispatchBatchSize;
    const pending = await this.outboxRepo.findPendingBatch(batchSize);

    for (const entry of pending) {
      try {
        await this.outboxRepo.markDispatched(entry.id);
        this.logger.debug(`Outbox dispatched: ${entry.id} (${entry.eventType})`);
      } catch (err) {
        await this.outboxRepo.markFailed(entry.id, (err as Error).message);
        this.logger.error(`Outbox dispatch failed: ${entry.id} — ${(err as Error).message}`);
      }
    }

    this.logger.log(`Outbox dispatch cycle complete (${pending.length} entries).`);
  }
}
