import { Meeting } from '../../domain/aggregates/meeting/meeting.aggregate';
import { MeetingDetailDto } from '../dtos/meeting.dto';

export class MeetingMapper {
  static toDto(meeting: Meeting): MeetingDetailDto {
    return {
      id: meeting.id,
      type: meeting.type,
      summary: meeting.summary,
      description: meeting.description,
      agenda: meeting.agenda,
      outcomes: meeting.outcomes,
      location: meeting.location,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      attendees: meeting.attendees,
      meetLink: meeting.meetLink,
      calendarLink: meeting.calendarLink,
      status: meeting.status,
      hostEmail: meeting.hostEmail,
      createdById: meeting.createdById,
      recordingUrl: meeting.recordingUrl,
      meetingNotes: meeting.meetingNotes,
      meetingActionItems: meeting.meetingActionItems,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }
}
