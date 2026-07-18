import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Expense } from '../../../domain/aggregates/expense/expense.aggregate';
import { IExpenseRepository } from '../../../domain/repositories/expense.repository';
import { FinalizeExpenseCommand } from './finalize-expense.command';

@CommandHandler(FinalizeExpenseCommand)
@Injectable()
export class FinalizeExpenseHandler implements ICommandHandler<FinalizeExpenseCommand, Expense> {
  constructor(@Inject(IExpenseRepository) private readonly expenseRepository: IExpenseRepository) { }

  async execute({ params: request }: FinalizeExpenseCommand): Promise<Expense> {
    const expense = await this.expenseRepository.findById(request.id);
    if (!expense) throw new BusinessException('Expense not found with id: ' + request.id);
    if (!expense.needsApproval()) {
      throw new BusinessException('Expense cannot be finalized in current status: ' + expense.status);
    }
    expense.finalize({ id: request.finalizedById });
    return this.expenseRepository.update(request.id, expense);
  }
}

