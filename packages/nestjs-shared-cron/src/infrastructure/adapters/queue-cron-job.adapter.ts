import { Injectable } from '@nestjs/common';
import { QueueProcessingService } from '@ce/nestjs-shared-queue';
import { ICronJobQueuePort } from '../../domain/ports/cron-job-queue.port';

@Injectable()
export class QueueCronJobAdapter implements ICronJobQueuePort {
  constructor(private readonly queueProcessing: QueueProcessingService) {}

  async enqueue(
    cronName: string,
    handlerName: string,
    payload?: Record<string, any>,
    scheduledAt?: Date,
  ): Promise<{ id: string }> {
    // Deterministic jobId based on the cron's own name + scheduled occurrence time.
    // BullMQ deduplicates by jobId — prevents double-firing when the external
    // scheduler calls the trigger endpoint more than once within the 60-min window.
    // cronName is the user-defined cron definition name (e.g. "daily-cleanup");
    // handlerName is the BullMQ processor class name used for routing.
    const jobId = scheduledAt
      ? `${cronName}:${scheduledAt.getTime()}`
      : `${cronName}:${Date.now()}`;

    const job = await this.queueProcessing.addJob(handlerName, payload ?? {}, { jobId });
    return { id: job.id! };
  }
}
