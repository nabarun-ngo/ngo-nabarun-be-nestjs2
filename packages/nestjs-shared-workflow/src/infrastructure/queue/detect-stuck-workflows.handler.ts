import { Inject, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@ce/nestjs-shared-queue';
import { DetectStuckWorkflowsJob } from '../../application/jobs/detect-stuck-workflows.job';
import { IWorkflowInstanceRepository } from '../../domain/ports/workflow-instance.repository';
import { WorkflowInstanceStatus } from '../../domain/enums/workflow-instance-status.enum';
import { OutboxDispatcherService } from '../../engine/outbox-dispatcher.service';

@QueueHandler(DetectStuckWorkflowsJob, { attempts: 1 })
export class DetectStuckWorkflowsHandler implements IQueueHandler<DetectStuckWorkflowsJob> {
  private readonly logger = new Logger(DetectStuckWorkflowsHandler.name);

  constructor(
    @Inject(IWorkflowInstanceRepository)
    private readonly instanceRepo: IWorkflowInstanceRepository,
    private readonly outboxDispatcher: OutboxDispatcherService,
  ) {}

  async execute(job: Job<DetectStuckWorkflowsJob>, _ctx: JobExecutionContext): Promise<void> {
    const raw = job.data as {
      payload?: { olderThanMinutes?: number; stuckAfterHours?: number };
      olderThanMinutes?: number;
      stuckAfterHours?: number;
    };
    const stuckAfterHours = raw.payload?.stuckAfterHours ?? raw.stuckAfterHours;
    const olderThanMinutes =
      raw.payload?.olderThanMinutes ??
      raw.olderThanMinutes ??
      (stuckAfterHours != null ? stuckAfterHours * 60 : 60);
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);

    const running = await this.instanceRepo.findAll({ status: WorkflowInstanceStatus.Running });
    const stuck = running.filter((i) => i.updatedAt < cutoff);

    for (const instance of stuck) {
      await this.outboxDispatcher.write({
        instanceId: instance.id,
        eventType: 'workflow.stuck.detected',
        payload: {
          currentElementId: instance.currentElementId,
          updatedAt: instance.updatedAt.toISOString(),
        },
      });
    }

    this.logger.log(`Detected ${stuck.length} stuck workflow instance(s).`);
  }
}
