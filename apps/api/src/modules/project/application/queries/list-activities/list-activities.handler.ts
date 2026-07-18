import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@nabarun-ngo/nestjs-shared-core';
import { IActivityRepository } from '../../../domain/repositories/activity.repository';
import { ActivityListResponseDto } from '../../dtos/activity-list.dto';
import { ActivityMapper } from '../../mappers/activity.mapper';
import { ListActivitiesQuery } from './list-activities.query';

@QueryHandler(ListActivitiesQuery)
@Injectable()
export class ListActivitiesHandler implements IQueryHandler<ListActivitiesQuery, ActivityListResponseDto> {
  constructor(@Inject(IActivityRepository) private readonly repo: IActivityRepository) { }

  async execute(query: ListActivitiesQuery): Promise<ActivityListResponseDto> {
    const filter = new BaseFilter(query.filter, query.pageIndex ?? 0, query.pageSize ?? 20);
    const page = await this.repo.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: { ...filter.props, projectId: query.projectId },
    });
    return {
      items: page.content.map(ActivityMapper.toDto),
      total: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }
}
