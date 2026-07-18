import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@nabarun-ngo/nestjs-shared-queue';
import { Injectable } from '@nestjs/common';
import { ReportGenerationService } from '../services/report-generation.service';
import { TriggerReportGenerationJob } from './trigger-report-generation.job';

@Injectable()
@QueueHandler(TriggerReportGenerationJob, { attempts: 3 })
export class TriggerReportGenerationHandler implements IQueueHandler<TriggerReportGenerationJob> {
  constructor(private readonly reportGenerationService: ReportGenerationService) { }

  async execute(job: Job<TriggerReportGenerationJob>, _ctx: JobExecutionContext): Promise<void> {
    const data = job.data;
    await this.reportGenerationService.startReportWorkflow({
      reportCode: data.reportCode,
      parameters: data.params ?? {},
      requestedById: data.requestedById ?? 'system',
      userPermissions: ['create:reports'],
      userRoles: data.userRoles ?? [],
    });
  }
}
