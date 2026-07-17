import { Prisma } from '../prisma/client';
import {
  Meeting,
  MeetingAgendaItem,
  MeetingParticipant,
} from '../../../internal/meeting/domain/aggregates/meeting/meeting.aggregate';
import { MeetingType } from '../../../internal/meeting/domain/enums/meeting-type.enum';
import { MapperUtils } from '../finance/mapper-utils';

export type MeetingPersistence = Prisma.MeetingGetPayload<Record<string, never>>;

export class MeetingPrismaMapper {
  static toDomain(row: MeetingPersistence | null): Meeting | null {
    if (!row) return null;
    return new Meeting(
      row.id,
      row.summary,
      row.type as MeetingType,
      row.status,
      row.startTime,
      row.endTime,
      MapperUtils.nullToUndefined(row.description),
      MeetingPrismaMapper.parseJson<MeetingAgendaItem[]>(row.agenda) ?? [],
      MapperUtils.nullToUndefined(row.outcomes),
      MapperUtils.nullToUndefined(row.location),
      MeetingPrismaMapper.parseJson<MeetingParticipant[]>(row.attendees) ?? [],
      MapperUtils.nullToUndefined(row.hostEmail),
      MapperUtils.nullToUndefined(row.createdById),
      MapperUtils.nullToUndefined(row.extMeetingId),
      MapperUtils.nullToUndefined(row.meetLink),
      MapperUtils.nullToUndefined(row.calendarLink),
      MapperUtils.nullToUndefined(row.recordingUrl),
      MapperUtils.nullToUndefined(row.meetingNotes),
      MapperUtils.nullToUndefined(row.meetingTranscript),
      MapperUtils.nullToUndefined(row.meetingActionItems),
      row.createdAt,
      row.updatedAt,
    );
  }

  static toCreate(domain: Meeting): Prisma.MeetingUncheckedCreateInput {
    return {
      id: domain.id,
      extMeetingId: MapperUtils.undefinedToNull(domain.extMeetingId),
      summary: domain.summary,
      description: MapperUtils.undefinedToNull(domain.description),
      type: domain.type,
      status: domain.status,
      location: MapperUtils.undefinedToNull(domain.location),
      startTime: domain.startTime,
      endTime: domain.endTime,
      agenda: JSON.stringify(domain.agenda),
      outcomes: MapperUtils.undefinedToNull(domain.outcomes),
      attendees: JSON.stringify(domain.attendees),
      hostEmail: MapperUtils.undefinedToNull(domain.hostEmail),
      meetLink: MapperUtils.undefinedToNull(domain.meetLink),
      calendarLink: MapperUtils.undefinedToNull(domain.calendarLink),
      recordingUrl: MapperUtils.undefinedToNull(domain.recordingUrl),
      meetingNotes: MapperUtils.undefinedToNull(domain.meetingNotes),
      meetingTranscript: MapperUtils.undefinedToNull(domain.meetingTranscript),
      meetingActionItems: MapperUtils.undefinedToNull(domain.meetingActionItems),
      createdById: MapperUtils.undefinedToNull(domain.createdById),
      version: 0,
    };
  }

  static toUpdate(domain: Meeting): Prisma.MeetingUncheckedUpdateInput {
    return {
      summary: domain.summary,
      description: MapperUtils.undefinedToNull(domain.description),
      status: domain.status,
      location: MapperUtils.undefinedToNull(domain.location),
      startTime: domain.startTime,
      endTime: domain.endTime,
      agenda: JSON.stringify(domain.agenda),
      outcomes: MapperUtils.undefinedToNull(domain.outcomes),
      attendees: JSON.stringify(domain.attendees),
      meetLink: MapperUtils.undefinedToNull(domain.meetLink),
      calendarLink: MapperUtils.undefinedToNull(domain.calendarLink),
      recordingUrl: MapperUtils.undefinedToNull(domain.recordingUrl),
      meetingNotes: MapperUtils.undefinedToNull(domain.meetingNotes),
      meetingTranscript: MapperUtils.undefinedToNull(domain.meetingTranscript),
      meetingActionItems: MapperUtils.undefinedToNull(domain.meetingActionItems),
      extMeetingId: MapperUtils.undefinedToNull(domain.extMeetingId),
      updatedAt: new Date(),
    };
  }

  private static parseJson<T>(value: string | null): T | undefined {
    if (!value) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
}
