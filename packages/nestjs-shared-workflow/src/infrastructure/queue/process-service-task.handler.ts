import { Inject, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@nabarun-ngo/nestjs-shared-queue';
import { ProcessServiceTaskJob } from '../../application/jobs/process-service-task.job';
import type { WorkflowQueueJobPayload } from '../../domain/ports/workflow-queue.port';
import { WorkflowOrchestratorService } from '../../application/services/workflow-orchestrator.service';
import { TaskHandlerRegistryService } from '../../application/services/task-handler-registry.service';
import { WorkflowServiceTaskHandlerNotFoundError } from '../../domain/errors/workflow.errors';
import { IdempotencyService } from '../../engine/idempotency.service';

@QueueHandler(ProcessServiceTaskJob, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
})
export class ProcessServiceTaskHandler implements IQueueHandler<ProcessServiceTaskJob> {
  private readonly logger = new Logger(ProcessServiceTaskHandler.name);

  constructor(
    private readonly orchestrator: WorkflowOrchestratorService,
    private readonly handlerRegistry: TaskHandlerRegistryService,
    private readonly idempotency: IdempotencyService,
  ) { }

  async execute(job: Job<ProcessServiceTaskJob>, _ctx: JobExecutionContext): Promise<void> {
    const payload =
      (job.data as ProcessServiceTaskJob).payload ??
      (job.data as unknown as WorkflowQueueJobPayload);
    const dedupeKey = `service-task:${payload.instanceId}:${payload.elementId}`;

    const existing = await this.idempotency.findByKey(dedupeKey);
    if (existing?.result?.completed) {
      this.logger.log(`Service task already completed: ${dedupeKey}`);
      return;
    }

    await this.idempotency.requireFreshClaim({
      key: dedupeKey,
      scope: 'serviceTask',
      instanceId: payload.instanceId,
    });

    const handlerName = payload.handler;
    if (!handlerName) {
      throw new WorkflowServiceTaskHandlerNotFoundError('undefined');
    }

    const handler = this.handlerRegistry.getTaskHandler(handlerName);
    if (!handler) {
      throw new WorkflowServiceTaskHandlerNotFoundError(handlerName);
    }

    const output = await handler.execute({
      instanceId: payload.instanceId,
      elementId: payload.elementId,
      input: payload.input ?? {},
      correlationId: payload.correlationId,
    });

    await this.orchestrator.completeServiceTask({
      instanceId: payload.instanceId,
      elementId: payload.elementId,
      output: output && typeof output === 'object' ? output : undefined,
      correlationId: payload.correlationId,
    });

    await this.idempotency.complete(dedupeKey, { completed: true });
    this.logger.log(`Service task completed: ${payload.instanceId}/${payload.elementId}`);
  }
}
