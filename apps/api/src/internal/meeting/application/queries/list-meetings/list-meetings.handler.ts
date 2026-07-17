import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@ce/nestjs-shared-core';
import { IMeetingRepository } from '../../../domain/repositories/meeting.repository';
import { MeetingListResponseDto } from '../../dtos/meeting.dto';
import { MeetingMapper } from '../../mappers/meeting.mapper';
import { ListMeetingsQuery } from './list-meetings.query';

@QueryHandler(ListMeetingsQuery)
@Injectable()
export class ListMeetingsHandler implements IQueryHandler<ListMeetingsQuery, MeetingListResponseDto> {
  constructor(@Inject(IMeetingRepository) private readonly repo: IMeetingRepository) {}

  async execute(query: ListMeetingsQuery): Promise<MeetingListResponseDto> {
    const filter = new BaseFilter(query.filter, query.pageIndex ?? 0, query.pageSize ?? 20);
    const page = await this.repo.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: filter.props,
    });
    return {
      items: page.content.map(MeetingMapper.toDto),
      total: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }
}
