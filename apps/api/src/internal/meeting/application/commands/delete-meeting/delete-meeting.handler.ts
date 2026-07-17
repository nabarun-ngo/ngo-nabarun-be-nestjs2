import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { IMeetingRepository } from '../../../domain/repositories/meeting.repository';
import { IMeetingCalendarPort } from '../../ports/meeting-calendar.port';
import { DeleteMeetingCommand } from './delete-meeting.command';

@CommandHandler(DeleteMeetingCommand)
@Injectable()
export class DeleteMeetingHandler implements ICommandHandler<DeleteMeetingCommand, void> {
  constructor(
    @Inject(IMeetingRepository) private readonly meetingRepository: IMeetingRepository,
    @Inject(IMeetingCalendarPort) private readonly calendarPort: IMeetingCalendarPort,
  ) {}

  async execute({ id }: DeleteMeetingCommand): Promise<void> {
    const meeting = await this.meetingRepository.findById(id);
    if (!meeting) {
      throw new BusinessException('Meeting not found with id ' + id);
    }
    if (meeting.extMeetingId) {
      await this.calendarPort.deleteEvent(meeting.extMeetingId);
    }
    await this.meetingRepository.delete(meeting.id);
  }
}
