import { Injectable } from '@nestjs/common';
import { CRON_JOB_QUEUE_PORT, ICronJobQueuePort } from '@ce/nestjs-shared-cron';
import { QueueProcessingService } from '@ce/nestjs-shared-queue';

@Injectable()
export class QueueCronJobAdapter implements ICronJobQueuePort {
  constructor(private readonly queueProcessing: QueueProcessingService) {}

  async enqueue(
    cronName: string,
    handlerName: string,
    payload?: Record<string, any>,
    scheduledAt?: Date,
  ): Promise<{ id: string }> {
    const jobId = scheduledAt
      ? `${cronName}:${scheduledAt.getTime()}`
      : `${cronName}:${Date.now()}`;

    const job = await this.queueProcessing.addJob(handlerName, payload ?? {}, { jobId });
    return { id: job.id! };
  }
}

export const CRON_JOB_QUEUE_PROVIDER = {
  provide: CRON_JOB_QUEUE_PORT,
  useClass: QueueCronJobAdapter,
};
