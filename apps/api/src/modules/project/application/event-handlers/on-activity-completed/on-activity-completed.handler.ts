import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { QueueProcessingService } from '@nabarun-ngo/nestjs-shared-queue';
import { ActivityCompletedEvent } from '../../../domain/events/activity-completed.event';
import { TriggerReportGenerationJob } from '../../../../reporting/application/jobs/trigger-report-generation.job';

@Injectable()
@EventsHandler(ActivityCompletedEvent)
export class OnActivityCompletedHandler implements IEventHandler<ActivityCompletedEvent> {
  private readonly logger = new Logger(OnActivityCompletedHandler.name);
  constructor(private readonly queueProcessing: QueueProcessingService) { }
  async handle(event: ActivityCompletedEvent): Promise<void> {
    try {
      await this.queueProcessing.addJob(
        TriggerReportGenerationJob.name,
        new TriggerReportGenerationJob('ACTIVITY_REPORT', { activityId: event.snapshot.activityId }),
      );
      this.logger.log('Enqueued ACTIVITY_REPORT for activity ' + event.snapshot.activityId);
    } catch (err) {
      this.logger.error('Failed to enqueue ACTIVITY_REPORT', err);
    }
  }
}
