import { Inject, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@nabarun-ngo/nestjs-shared-queue';
import { WorkflowTimerJob } from '../../application/jobs/workflow-timer.job';
import { WORKFLOW_QUEUE_PORT, IWorkflowQueuePort } from '../../domain/ports/workflow-queue.port';
import { IWorkflowInboxRepository } from '../../domain/ports/workflow-inbox.repository';
import { InboxTaskStatus } from '../../domain/enums/inbox-task-status.enum';

@QueueHandler(WorkflowTimerJob, { attempts: 2 })
export class WorkflowTimerHandler implements IQueueHandler<WorkflowTimerJob> {
  private readonly logger = new Logger(WorkflowTimerHandler.name);

  constructor(
    @Inject(IWorkflowInboxRepository)
    private readonly inboxRepo: IWorkflowInboxRepository,
    @Inject(WORKFLOW_QUEUE_PORT)
    private readonly queuePort: IWorkflowQueuePort,
  ) { }

  async execute(job: Job<WorkflowTimerJob>, _ctx: JobExecutionContext): Promise<void> {
    const payload =
      (job.data as WorkflowTimerJob).payload ??
      (job.data as unknown as { instanceId: string; elementId: string; correlationId?: string });
    const { instanceId, elementId, correlationId } = payload;
    const task = await this.inboxRepo.findByInstanceAndElement(instanceId, elementId);

    if (!task || task.status === InboxTaskStatus.Completed) {
      this.logger.log(`SLA timer skipped — task not open: ${instanceId}/${elementId}`);
      return;
    }

    await this.queuePort.enqueue(
      'slaEscalation',
      { instanceId, elementId, correlationId },
      { dedupeKey: `escalation:${instanceId}:${elementId}` },
    );

    this.logger.log(`SLA deadline reached, escalation enqueued: ${instanceId}/${elementId}`);
  }
}
