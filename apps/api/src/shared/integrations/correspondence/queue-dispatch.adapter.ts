import { Injectable } from '@nestjs/common';
import { QueueFacade } from '@ce/nestjs-shared-queue';
import {
  DISPATCH_QUEUE_PORT,
  IDispatchQueuePort,
  CorrespondenceDispatchPayload,
} from '@ce/nestjs-shared-correspondence';
import { CorrespondenceDispatchJob } from '@ce/nestjs-shared-correspondence/application/jobs/correspondence-dispatch.job';

@Injectable()
export class QueueDispatchAdapter implements IDispatchQueuePort {
  constructor(private readonly queueFacade: QueueFacade) {}

  async enqueue(payload: CorrespondenceDispatchPayload): Promise<void> {
    await this.queueFacade.dispatch(new CorrespondenceDispatchJob(payload), {
      jobId: payload.dispatchId,
    });
  }
}

export const DISPATCH_QUEUE_PORT_PROVIDER = {
  provide: DISPATCH_QUEUE_PORT,
  useClass: QueueDispatchAdapter,
};
