import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@ce/nestjs-shared-core';
import { IExpenseRepository } from '../../../domain/repositories/expense.repository';
import { ExpenseListResponseDto } from '../../dtos/expense-list.dto';
import { ExpenseMapper } from '../../mappers/expense.mapper';
import { ListExpensesQuery } from './list-expenses.query';

@QueryHandler(ListExpensesQuery)
@Injectable()
export class ListExpensesHandler implements IQueryHandler<ListExpensesQuery, ExpenseListResponseDto> {
  constructor(@Inject(IExpenseRepository) private readonly repo: IExpenseRepository) {}

  async execute(query: ListExpensesQuery): Promise<ExpenseListResponseDto> {
    const filter = new BaseFilter(query.filter, query.pageIndex ?? 0, query.pageSize ?? 20);
    const page = await this.repo.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: {
        expenseId: filter.props?.expenseId,
        expenseRefId: filter.props?.expenseRefId,
        expenseStatus: filter.props?.expenseStatus,
        payerId: filter.props?.payerId,
        startDate: filter.props?.startDate,
        endDate: filter.props?.endDate,
      },
    });
    return {
      items: page.content.map(ExpenseMapper.toDto),
      total: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }
}

