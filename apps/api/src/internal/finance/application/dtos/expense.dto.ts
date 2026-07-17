import { ExpenseRefType, ExpenseStatus } from '../../domain/enums/expense.enum';
import { FinanceUserDto } from './finance-user.dto';
import { KeyValueOption } from '../ports/finance-reference-data.port';

export class ExpenseItemDetailDto {
  itemName!: string;
  amount!: number;
}

export class ExpenseDetailDto {
  id!: string;
  name!: string;
  description!: string;
  expenseDate!: Date;
  createdBy?: FinanceUserDto;
  createdOn!: Date;
  isDeligated?: boolean;
  paidBy?: FinanceUserDto;
  finalizedBy?: FinanceUserDto;
  status!: ExpenseStatus;
  finalizedOn?: Date;
  settledBy?: FinanceUserDto;
  settledOn?: Date;
  expenseItems?: ExpenseItemDetailDto[];
  finalAmount!: number;
  expenseRefType?: ExpenseRefType;
  expenseRefId?: string;
  txnNumber?: string;
  activityName?: string;
  activityId?: string;
  settlementAccountId?: string;
  rejectedBy?: FinanceUserDto;
  rejectedOn?: Date;
  remarks?: string;
}

export class ExpenseRefDataDto {
  expenseStatuses?: KeyValueOption[];
  expenseRefTypes?: KeyValueOption[];
}
