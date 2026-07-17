import { WorkflowQueueJobPayload } from '../../domain/ports/workflow-queue.port';

export class ProcessServiceTaskJob {
  constructor(public readonly payload: WorkflowQueueJobPayload) {}
}
