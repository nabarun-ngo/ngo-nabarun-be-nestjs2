import { ExpenseStatus } from '../../../domain/enums/expense.enum';

export class ListExpensesQuery {
  constructor(
    public readonly filter: {
      expenseId?: string;
      expenseRefId?: string;
      expenseStatus?: ExpenseStatus[];
      payerId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
  ) {}
}

