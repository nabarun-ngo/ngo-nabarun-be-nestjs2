import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@ce/nestjs-shared-core';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { ProjectListResponseDto } from '../../dtos/project-list.dto';
import { ProjectMapper } from '../../mappers/project.mapper';
import { ListProjectsQuery } from './list-projects.query';

@QueryHandler(ListProjectsQuery)
@Injectable()
export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery, ProjectListResponseDto> {
  constructor(@Inject(IProjectRepository) private readonly repo: IProjectRepository) {}

  async execute(query: ListProjectsQuery): Promise<ProjectListResponseDto> {
    const filter = new BaseFilter(query.filter, query.pageIndex ?? 0, query.pageSize ?? 20);
    const page = await this.repo.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: filter.props,
    });
    return {
      items: page.content.map(ProjectMapper.toDto),
      total: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }
}
