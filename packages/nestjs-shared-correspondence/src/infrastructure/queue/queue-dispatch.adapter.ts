import { Injectable } from '@nestjs/common';
import { QueueFacade } from '@ce/nestjs-shared-queue';
import { IDispatchQueuePort, CorrespondenceDispatchPayload } from '../../domain/ports/dispatch-queue.port';
import { CorrespondenceDispatchJob } from '../../application/jobs/correspondence-dispatch.job';

@Injectable()
export class QueueDispatchAdapter implements IDispatchQueuePort {
  constructor(private readonly queueFacade: QueueFacade) {}

  async enqueue(payload: CorrespondenceDispatchPayload): Promise<void> {
    await this.queueFacade.dispatch(new CorrespondenceDispatchJob(payload), {
      jobId: payload.dispatchId,
    });
  }
}
