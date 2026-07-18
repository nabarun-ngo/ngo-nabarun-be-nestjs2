import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@ce/nestjs-shared-core';
import { IEarningRepository } from '../../../domain/repositories/earning.repository';
import { EarningListResponseDto } from '../../dtos/earning-list.dto';
import { EarningMapper } from '../../mappers/earning.mapper';
import { ListEarningsQuery } from './list-earnings.query';

@QueryHandler(ListEarningsQuery)
@Injectable()
export class ListEarningsHandler implements IQueryHandler<ListEarningsQuery, EarningListResponseDto> {
  constructor(@Inject(IEarningRepository) private readonly repo: IEarningRepository) {}

  async execute(query: ListEarningsQuery): Promise<EarningListResponseDto> {
    const filter = new BaseFilter(query.filter, query.pageIndex ?? 0, query.pageSize ?? 20);
    const page = await this.repo.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: filter.props,
    });
    return {
      items: page.content.map(EarningMapper.toDto),
      total: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }
}

