import { MeetingType } from '../../../domain/enums/meeting-type.enum';
import { MeetingAgendaItem, MeetingParticipant } from '../../../domain/aggregates/meeting/meeting.aggregate';

export class CreateMeetingCommand {
  constructor(
    public readonly params: {
      summary: string;
      type: MeetingType;
      description?: string;
      startTime: string;
      endTime: string;
      agenda?: MeetingAgendaItem[];
      location?: string;
      attendees: MeetingParticipant[];
      createdById?: string;
    },
  ) {}
}
