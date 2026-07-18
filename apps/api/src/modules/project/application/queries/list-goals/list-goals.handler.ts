import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@ce/nestjs-shared-core';
import { IGoalRepository } from '../../../domain/repositories/goal.repository';
import { GoalMapper } from '../../mappers/goal.mapper';
import { GoalListResponseDto } from '../../dtos/goal.dto';
import { ListGoalsQuery } from './list-goals.query';
@QueryHandler(ListGoalsQuery) @Injectable()
export class ListGoalsHandler implements IQueryHandler<ListGoalsQuery, GoalListResponseDto> {
  constructor(@Inject(IGoalRepository) private readonly repo: IGoalRepository) {}
  async execute(q: ListGoalsQuery): Promise<GoalListResponseDto> {
    const page = await this.repo.findPaged(new BaseFilter({ projectId: q.projectId }, q.pageIndex ?? 0, q.pageSize ?? 20));
    return { items: page.content.map(GoalMapper.toDto), total: page.totalSize, pageIndex: page.pageIndex, pageSize: page.pageSize };
  }
}