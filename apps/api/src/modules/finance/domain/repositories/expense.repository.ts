import { IRepository } from '@nabarun-ngo/nestjs-shared-core';
import { Expense } from '../aggregates/expense/expense.aggregate';
import { ExpenseStatus } from '../enums/expense.enum';

export interface ExpenseFilter {
  startDate?: Date;
  endDate?: Date;
  expenseRefId?: string;
  expenseId?: string;
  expenseStatus?: ExpenseStatus[];
  payerId?: string;
}

export const IExpenseRepository = Symbol('IExpenseRepository');

export interface IExpenseRepository extends IRepository<Expense, string, ExpenseFilter> { }
