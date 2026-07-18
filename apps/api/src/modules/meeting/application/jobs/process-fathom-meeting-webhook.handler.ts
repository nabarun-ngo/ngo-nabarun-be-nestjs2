import { Inject, Injectable, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job } from '@ce/nestjs-shared-queue';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository';
import { ProcessFathomMeetingWebhookJob } from './process-fathom-meeting-webhook.job';

const FUZZY_START_WINDOW_BEFORE_MINUTES = 30;
const FUZZY_START_WINDOW_AFTER_MINUTES = 10;
const FUZZY_END_WINDOW_MINUTES = 10;

@Injectable()
@QueueHandler(ProcessFathomMeetingWebhookJob, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
export class ProcessFathomMeetingWebhookHandler implements IQueueHandler<ProcessFathomMeetingWebhookJob> {
  private readonly logger = new Logger(ProcessFathomMeetingWebhookHandler.name);

  constructor(@Inject(IMeetingRepository) private readonly meetingRepo: IMeetingRepository) {}

  async execute(job: Job<ProcessFathomMeetingWebhookJob>): Promise<{ success: boolean; reason?: string; meetingId?: string }> {
    const payload = job.data.payload;
    const fathomTitle = (payload.meeting_title || payload.title || '').trim();
    job.log?.(`Starting processing for Fathom Meeting: ${fathomTitle}`);

    if (!payload.scheduled_start_time || !payload.scheduled_end_time) {
      job.log?.('Skipping: missing start or end time.');
      return { success: false, reason: 'missing_time' };
    }

    const startRangeGte = new Date(payload.scheduled_start_time);
    startRangeGte.setMinutes(startRangeGte.getMinutes() - FUZZY_START_WINDOW_BEFORE_MINUTES);

    const startRangeLte = new Date(payload.scheduled_start_time);
    startRangeLte.setMinutes(startRangeLte.getMinutes() + FUZZY_START_WINDOW_AFTER_MINUTES);

    const endRangeGte = new Date(payload.scheduled_end_time);
    endRangeGte.setMinutes(endRangeGte.getMinutes() - FUZZY_END_WINDOW_MINUTES);

    const endRangeLte = new Date(payload.scheduled_end_time);
    endRangeLte.setMinutes(endRangeLte.getMinutes() + FUZZY_END_WINDOW_MINUTES);

    const meetings = await this.meetingRepo.findByTimeRange(startRangeGte, startRangeLte, endRangeGte, endRangeLte);
    job.log?.(`Found ${meetings.length} meetings within the time range.`);

    const fathomTitleLower = fathomTitle.toLowerCase();
    const matchedMeetings = meetings.filter((m) => {
      const summary = (m.summary || '').toLowerCase();
      return summary.includes(fathomTitleLower) || fathomTitleLower.includes(summary);
    });

    if (matchedMeetings.length === 1) {
      const meeting = matchedMeetings[0];
      job.log?.(`Unique meeting found: ${meeting.id} - ${meeting.summary}`);

      meeting.applyFathomData({
        recordingUrl: payload.share_url,
        meetingNotes: payload.default_summary?.markdown_formatted,
        meetingTranscript: payload.transcript ? JSON.stringify(payload.transcript) : undefined,
        meetingActionItems: payload.action_items ? JSON.stringify(payload.action_items) : undefined,
      });
      await this.meetingRepo.update(meeting.id, meeting);

      this.logger.log(`Meeting ${meeting.id} updated with Fathom details.`);
      job.log?.(`Successfully mapped Fathom webhook to meeting ${meeting.id}`);
      return { success: true, meetingId: meeting.id };
    }

    if (matchedMeetings.length > 1) {
      job.log?.(`Warning: Multiple meetings matched the fuzzy search: ${matchedMeetings.map((m) => m.id).join(', ')}`);
      return { success: false, reason: 'multiple_matches' };
    }

    job.log?.(`No unique meeting matched the title: ${fathomTitleLower}`);
    return { success: false, reason: 'no_match' };
  }
}
