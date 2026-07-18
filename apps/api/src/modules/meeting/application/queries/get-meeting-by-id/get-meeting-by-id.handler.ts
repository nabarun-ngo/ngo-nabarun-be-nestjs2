import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { IMeetingRepository } from '../../../domain/repositories/meeting.repository';
import { MeetingDetailDto } from '../../dtos/meeting.dto';
import { MeetingMapper } from '../../mappers/meeting.mapper';
import { GetMeetingByIdQuery } from './get-meeting-by-id.query';

@QueryHandler(GetMeetingByIdQuery)
@Injectable()
export class GetMeetingByIdHandler implements IQueryHandler<GetMeetingByIdQuery, MeetingDetailDto> {
  constructor(@Inject(IMeetingRepository) private readonly repo: IMeetingRepository) {}

  async execute(query: GetMeetingByIdQuery): Promise<MeetingDetailDto> {
    const meeting = await this.repo.findById(query.id);
    if (!meeting) throw new BusinessException('Meeting not found with id ' + query.id);
    return MeetingMapper.toDto(meeting);
  }
}
