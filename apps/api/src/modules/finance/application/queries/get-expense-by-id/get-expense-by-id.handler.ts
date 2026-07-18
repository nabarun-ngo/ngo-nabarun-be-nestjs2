import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { IExpenseRepository } from '../../../domain/repositories/expense.repository';
import { ExpenseDetailDto } from '../../dtos/expense.dto';
import { ExpenseMapper } from '../../mappers/expense.mapper';
import { GetExpenseByIdQuery } from './get-expense-by-id.query';

@QueryHandler(GetExpenseByIdQuery)
@Injectable()
export class GetExpenseByIdHandler implements IQueryHandler<GetExpenseByIdQuery, ExpenseDetailDto> {
  constructor(@Inject(IExpenseRepository) private readonly repo: IExpenseRepository) {}

  async execute(query: GetExpenseByIdQuery): Promise<ExpenseDetailDto> {
    const expense = await this.repo.findById(query.id);
    if (!expense) throw new BusinessException('Expense not found with id: ' + query.id);
    return ExpenseMapper.toDto(expense);
  }
}

