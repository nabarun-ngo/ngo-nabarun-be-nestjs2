import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DateTime } from 'luxon';
import { Meeting, MeetingParticipant } from '../../../domain/aggregates/meeting/meeting.aggregate';
import { MeetingType } from '../../../domain/enums/meeting-type.enum';
import { IMeetingRepository } from '../../../domain/repositories/meeting.repository';
import { IMeetingCalendarPort } from '../../ports/meeting-calendar.port';
import { MEETING_OPTIONS } from '../../../infrastructure/meeting-options.token';
import { MeetingModuleOptions } from '../../../meeting.schema';
import { CreateMeetingCommand } from './create-meeting.command';

const ONLINE_REMINDERS = [
  { method: 'popup' as const, minutes: 10 },
  { method: 'popup' as const, minutes: 30 },
  { method: 'popup' as const, minutes: 60 },
  { method: 'email' as const, minutes: 60 },
];

const OFFLINE_REMINDERS = [
  { method: 'popup' as const, minutes: 1 * 60 },
  { method: 'popup' as const, minutes: 2 * 60 },
  { method: 'popup' as const, minutes: 4 * 60 },
  { method: 'popup' as const, minutes: 6 * 60 },
  { method: 'email' as const, minutes: 6 * 60 },
];

@CommandHandler(CreateMeetingCommand)
@Injectable()
export class CreateMeetingHandler implements ICommandHandler<CreateMeetingCommand, Meeting> {
  private readonly logger = new Logger(CreateMeetingHandler.name);

  constructor(
    @Inject(IMeetingRepository) private readonly meetingRepository: IMeetingRepository,
    @Inject(IMeetingCalendarPort) private readonly calendarPort: IMeetingCalendarPort,
    @Inject(MEETING_OPTIONS) private readonly options: MeetingModuleOptions,
  ) {}

  async execute({ params }: CreateMeetingCommand): Promise<Meeting> {
    const startTime = DateTime.fromISO(params.startTime, { zone: this.options.timezone }).toJSDate();
    const endTime = DateTime.fromISO(params.endTime, { zone: this.options.timezone }).toJSDate();
    const agendaDescription = (params.agenda ?? [])
      .map((item, index) => `\n${index + 1}. ${item.agenda}`)
      .join('\n');

    const calendarEvent = await this.calendarPort.createEvent({
      summary: params.summary,
      description: `${params.description ?? ''}\n\nAgenda: ${agendaDescription}`,
      startTime,
      endTime,
      location: params.location,
      timeZone: this.options.timezone,
      attendees: this.prepareAttendees(params.attendees),
      addMeetLink: params.type === MeetingType.ONLINE,
      guestPermissions: {
        guestsCanSeeOtherGuests: true,
        guestsCanModify: true,
        guestsCanInviteOthers: true,
        anyoneCanAddSelf: true,
      },
      reminders: params.type === MeetingType.ONLINE ? ONLINE_REMINDERS : OFFLINE_REMINDERS,
    });

    const meeting = Meeting.create({
      summary: params.summary,
      type: params.type,
      status: calendarEvent.status,
      startTime,
      endTime,
      description: params.description,
      agenda: params.agenda,
      location: params.location,
      attendees: params.attendees,
      hostEmail: calendarEvent.hostEmail,
      createdById: params.createdById,
    });
    meeting.linkExternalEvent(calendarEvent.eventId, calendarEvent.meetLink, calendarEvent.calendarLink);

    return this.meetingRepository.create(meeting);
  }

  private prepareAttendees(attendees: MeetingParticipant[]): string[] {
    if (!this.options.mockAttendeesInNonProd) {
      return attendees.map((attendee) => attendee.email);
    }
    this.logger.warn(`Mocking attendee emails. Redirecting to ${this.options.mockedAttendeeEmail}`);
    return this.options.mockedAttendeeEmail ? [this.options.mockedAttendeeEmail] : [];
  }
}
