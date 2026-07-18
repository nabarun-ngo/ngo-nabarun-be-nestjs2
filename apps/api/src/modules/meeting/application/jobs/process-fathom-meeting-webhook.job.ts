import { FathomWebhookDto } from '../dtos/fathom-webhook.dto';

export class ProcessFathomMeetingWebhookJob {
  constructor(public readonly payload: FathomWebhookDto) {}
}
