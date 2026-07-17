import { ExpenseRefType, ExpenseStatus } from '../../../domain/enums/expense.enum';

export class UpdateExpenseCommand {
  constructor(
    public readonly params: {
      id: string;
      updatedById: string;
      name?: string;
      description?: string;
      expenseDate?: Date;
      expenseRefId?: string;
      expenseRefType?: ExpenseRefType;
      expenseItems?: { itemName: string; amount: number }[];
      payerId?: string;
      remarks?: string;
      status?: ExpenseStatus;
    },
  ) {}
}

