import { ExpenseRefType } from '../../../domain/enums/expense.enum';

export class CreateExpenseCommand {
  constructor(
    public readonly params: {
      name: string;
      description?: string;
      currency?: string;
      expenseDate?: Date;
      expenseRefId?: string;
      expenseRefType: ExpenseRefType;
      expenseItems?: { itemName: string; amount: number }[];
      requestedById: string;
      paidById: string;
    },
  ) {}
}

