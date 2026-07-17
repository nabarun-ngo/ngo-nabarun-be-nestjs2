import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@ce/nestjs-shared-auth';
import { QueueFacade } from '@ce/nestjs-shared-queue';
import { FathomWebhookDto } from '../../application/dtos/fathom-webhook.dto';
import { ProcessFathomMeetingWebhookJob } from '../../application/jobs/process-fathom-meeting-webhook.job';

@ApiTags('Webhooks')
@Controller('webhooks')
@Public()
export class MeetingWebhookController {
  private readonly logger = new Logger(MeetingWebhookController.name);

  constructor(private readonly queueFacade: QueueFacade) {}

  @Post('fathom')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Fathom "New meeting content ready" webhook' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook received successfully' })
  async handleFathomMeetingContentReady(@Body() payload: FathomWebhookDto) {
    this.logger.log(`Received Fathom webhook for meeting: ${payload.meeting_title || payload.title}, queuing...`);
    const job = await this.queueFacade.dispatch(new ProcessFathomMeetingWebhookJob(payload));
    return { status: 'success', jobId: job.id };
  }
}
