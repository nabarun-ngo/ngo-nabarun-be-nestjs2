import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IFinanceReferenceDataPort } from '../../ports/finance-reference-data.port';
import { ExpenseRefDataDto } from '../../dtos/expense.dto';
import { GetExpenseReferenceDataQuery } from './get-expense-reference-data.query';

@QueryHandler(GetExpenseReferenceDataQuery)
@Injectable()
export class GetExpenseReferenceDataHandler implements IQueryHandler<GetExpenseReferenceDataQuery, ExpenseRefDataDto> {
  constructor(@Optional() @Inject(IFinanceReferenceDataPort) private readonly port: IFinanceReferenceDataPort) {}

  async execute(): Promise<ExpenseRefDataDto> {
    const data = this.port ? await this.port.getExpenseReferenceData() : {};
    return { expenseStatuses: data.expenseStatuses, expenseRefTypes: data.expenseRefTypes };
  }
}

