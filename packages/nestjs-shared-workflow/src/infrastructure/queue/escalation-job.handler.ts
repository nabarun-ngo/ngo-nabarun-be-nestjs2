import { Inject, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@nabarun-ngo/nestjs-shared-queue';
import { EscalationJob } from '../../application/jobs/escalation.job';
import { IWorkflowInboxRepository } from '../../domain/ports/workflow-inbox.repository';
import { InboxTaskStatus } from '../../domain/enums/inbox-task-status.enum';
import { OutboxDispatcherService } from '../../engine/outbox-dispatcher.service';

@QueueHandler(EscalationJob, { attempts: 2 })
export class EscalationJobHandler implements IQueueHandler<EscalationJob> {
  private readonly logger = new Logger(EscalationJobHandler.name);

  constructor(
    @Inject(IWorkflowInboxRepository)
    private readonly inboxRepo: IWorkflowInboxRepository,
    private readonly outboxDispatcher: OutboxDispatcherService,
  ) { }

  async execute(job: Job<EscalationJob>, _ctx: JobExecutionContext): Promise<void> {
    const payload =
      (job.data as EscalationJob).payload ??
      (job.data as unknown as { instanceId: string; elementId: string });
    const { instanceId, elementId } = payload;
    const task = await this.inboxRepo.findByInstanceAndElement(instanceId, elementId);

    if (!task || task.status === InboxTaskStatus.Completed) {
      this.logger.log(`Escalation skipped — task not open: ${instanceId}/${elementId}`);
      return;
    }

    await this.outboxDispatcher.write({
      instanceId,
      eventType: 'workflow.task.escalated',
      payload: {
        elementId,
        taskId: task.id,
        assignedToId: task.assignedToId,
        slaDeadlineAt: task.slaDeadlineAt,
      },
    });

    this.logger.log(`Task escalated: ${instanceId}/${elementId}`);
  }
}
