import { Expense } from '../../domain/aggregates/expense/expense.aggregate';
import { ExpenseItem } from '../../domain/value-objects/expense-item.vo';
import { ExpenseDetailDto, ExpenseItemDetailDto } from '../dtos/expense.dto';
import { FinanceUserMapper } from './finance-user.mapper';

export class ExpenseMapper {
  static toDto(expense: Expense): ExpenseDetailDto {
    return {
      id: expense.id,
      name: expense.name,
      description: expense.description,
      expenseDate: expense.expenseDate,
      createdBy: FinanceUserMapper.toDto(expense.requestedBy),
      createdOn: expense.createdAt!,
      isDeligated: expense.isDelegated,
      paidBy: FinanceUserMapper.toDto(expense.paidBy),
      finalizedBy: FinanceUserMapper.toDto(expense.finalizedBy),
      status: expense.status,
      finalizedOn: expense.finalizedDate,
      settledBy: FinanceUserMapper.toDto(expense.settledBy),
      settledOn: expense.settledDate,
      expenseItems: expense.expenseItems.map((item) => this.expenseItemToDto(item)),
      finalAmount: expense.amount,
      expenseRefType: expense.referenceType,
      expenseRefId: expense.referenceId,
      txnNumber: expense.transactionId,
      settlementAccountId: expense.accountId,
      rejectedBy: FinanceUserMapper.toDto(expense.rejectedBy),
      rejectedOn: expense.rejectedDate,
      remarks: expense.remarks,
      activityId: expense.activityId,
      activityName: expense.activityName,
    };
  }

  private static expenseItemToDto(item: ExpenseItem): ExpenseItemDetailDto {
    return { itemName: item.itemName, amount: item.amount };
  }
}

