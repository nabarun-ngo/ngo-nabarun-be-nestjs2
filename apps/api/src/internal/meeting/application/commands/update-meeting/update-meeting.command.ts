import { MeetingAgendaItem, MeetingParticipant } from '../../../domain/aggregates/meeting/meeting.aggregate';

export class UpdateMeetingCommand {
  constructor(
    public readonly params: {
      id: string;
      summary?: string;
      description?: string;
      agenda?: MeetingAgendaItem[];
      outcomes?: string;
      startTime?: string;
      endTime?: string;
      attendees?: MeetingParticipant[];
      location?: string;
      cancelEvent?: boolean;
    },
  ) {}
}
