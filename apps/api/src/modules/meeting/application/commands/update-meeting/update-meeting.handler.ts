import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { DateTime } from 'luxon';
import { Meeting } from '../../../domain/aggregates/meeting/meeting.aggregate';
import { IMeetingRepository } from '../../../domain/repositories/meeting.repository';
import { IMeetingCalendarPort } from '../../ports/meeting-calendar.port';
import { MEETING_OPTIONS } from '../../../infrastructure/meeting-options.token';
import { MeetingModuleOptions } from '../../../meeting.schema';
import { UpdateMeetingCommand } from './update-meeting.command';

@CommandHandler(UpdateMeetingCommand)
@Injectable()
export class UpdateMeetingHandler implements ICommandHandler<UpdateMeetingCommand, Meeting> {
  constructor(
    @Inject(IMeetingRepository) private readonly meetingRepository: IMeetingRepository,
    @Inject(IMeetingCalendarPort) private readonly calendarPort: IMeetingCalendarPort,
    @Inject(MEETING_OPTIONS) private readonly options: MeetingModuleOptions,
  ) { }

  async execute({ params }: UpdateMeetingCommand): Promise<Meeting> {
    const meeting = await this.meetingRepository.findById(params.id);
    if (!meeting) {
      throw new BusinessException('Meeting not found with id ' + params.id);
    }

    const startTime = params.startTime
      ? DateTime.fromISO(params.startTime, { zone: this.options.timezone }).toJSDate()
      : undefined;
    const endTime = params.endTime
      ? DateTime.fromISO(params.endTime, { zone: this.options.timezone }).toJSDate()
      : undefined;

    const needsExternalSync = meeting.update({
      summary: params.summary,
      description: params.description,
      agenda: params.agenda,
      outcomes: params.outcomes,
      startTime,
      endTime,
      attendees: params.attendees,
      location: params.location,
    });

    if (params.cancelEvent) {
      if (meeting.extMeetingId) {
        await this.calendarPort.deleteEvent(meeting.extMeetingId);
      }
      meeting.cancel();
    } else if (needsExternalSync && meeting.extMeetingId) {
      const agendaDescription = meeting.agenda.map((item, index) => `\n${index + 1}. ${item.agenda}`).join('\n');
      const calendarEvent = await this.calendarPort.updateEvent(meeting.extMeetingId, {
        summary: params.summary,
        description: `${params.description ?? meeting.description ?? ''}\n\nAgenda: ${agendaDescription}`,
        startTime,
        endTime,
        location: params.location,
        timeZone: this.options.timezone,
        attendees: params.attendees?.map((attendee) => attendee.email),
      });
      meeting.update({ status: calendarEvent.status });
    }

    return this.meetingRepository.update(meeting.id, meeting);
  }
}
