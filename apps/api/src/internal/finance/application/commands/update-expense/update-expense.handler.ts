import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { Expense } from '../../../domain/aggregates/expense/expense.aggregate';
import { ExpenseStatus } from '../../../domain/enums/expense.enum';
import { ExpenseItem } from '../../../domain/value-objects/expense-item.vo';
import { IExpenseRepository } from '../../../domain/repositories/expense.repository';
import { UpdateExpenseCommand } from './update-expense.command';

@CommandHandler(UpdateExpenseCommand)
@Injectable()
export class UpdateExpenseHandler implements ICommandHandler<UpdateExpenseCommand, Expense> {
  constructor(@Inject(IExpenseRepository) private readonly expenseRepository: IExpenseRepository) {}

  async execute({ params: request }: UpdateExpenseCommand): Promise<Expense> {
    const expense = await this.expenseRepository.findById(request.id);
    if (!expense) throw new BusinessException('Expense not found with id: ' + request.id);

    if (request.status === ExpenseStatus.SUBMITTED) {
      expense.submit({ id: request.updatedById });
    } else if (request.status === ExpenseStatus.REJECTED) {
      expense.reject({ id: request.updatedById }, request.remarks);
    } else {
      const expenseItems = request.expenseItems?.map(
        (item) => new ExpenseItem(item.itemName, undefined, item.amount),
      );
      expense.update({
        name: request.name,
        description: request.description,
        expenseDate: request.expenseDate,
        remarks: request.remarks,
        payerId: request.payerId,
        expenseItems,
        expenseRefType: request.expenseRefType,
        expenseRefId: request.expenseRefId,
      });
    }
    return this.expenseRepository.update(request.id, expense);
  }
}

