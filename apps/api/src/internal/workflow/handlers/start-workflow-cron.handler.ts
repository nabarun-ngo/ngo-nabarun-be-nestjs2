import { Injectable, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@ce/nestjs-shared-queue';
import { WorkflowFacade } from '@ce/nestjs-shared-workflow';
import { StartWorkflowCronJob } from './start-workflow-cron.job';

@Injectable()
@QueueHandler(StartWorkflowCronJob, { attempts: 2 })
export class StartWorkflowCronHandler implements IQueueHandler<StartWorkflowCronJob> {
  private readonly logger = new Logger(StartWorkflowCronHandler.name);

  constructor(private readonly workflowFacade: WorkflowFacade) {}

  async execute(
    job: Job<StartWorkflowCronJob>,
    _ctx: JobExecutionContext,
  ): Promise<void> {
    const payload =
      (job.data as StartWorkflowCronJob).payload ??
      (job.data as unknown as StartWorkflowCronJob['payload']);
    const instance = await this.workflowFacade.startWorkflow({
      definitionId: payload.definitionId,
      definitionVersion: payload.definitionVersion,
      name: payload.name,
      description: payload.description,
      context: payload.context,
      initiatedById: payload.initiatedById ?? null,
      initiatedForId: payload.initiatedForId ?? null,
      correlationId: `cron:${job.id}`,
    });

    this.logger.log(
      `Cron-started workflow ${instance.id} (${payload.definitionId})`,
    );
  }
}
