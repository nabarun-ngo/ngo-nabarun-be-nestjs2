import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { Expense } from '../../../domain/aggregates/expense/expense.aggregate';
import { TransactionRefType, TransactionType } from '../../../domain/enums/transaction.enum';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { IExpenseRepository } from '../../../domain/repositories/expense.repository';
import { CreateTransactionCommand } from '../create-transaction/create-transaction.command';
import { SettleExpenseCommand } from './settle-expense.command';

@CommandHandler(SettleExpenseCommand)
@Injectable()
export class SettleExpenseHandler implements ICommandHandler<SettleExpenseCommand, Expense> {
  constructor(
    @Inject(IExpenseRepository) private readonly expenseRepository: IExpenseRepository,
    @Inject(IAccountRepository) private readonly accountRepository: IAccountRepository,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: request }: SettleExpenseCommand): Promise<Expense> {
    const expense = await this.expenseRepository.findById(request.id);
    if (!expense) throw new BusinessException(`Expense not found with id: ${request.id}`);
    if (!expense.isPayable()) {
      throw new BusinessException(`Expense cannot be settled in current status: ${expense.status}`);
    }

    const account = await this.accountRepository.findById(request.accountId);
    if (!account) throw new BusinessException(`Account not found with id: ${request.accountId}`);
    if (!account.hasSufficientFunds(expense.amount)) {
      throw new BusinessException('Insufficient account balance');
    }

    const transactionRef = await this.commandBus.execute(
      new CreateTransactionCommand({
        txnAmount: expense.amount,
        currency: expense.currency,
        accountId: request.accountId,
        txnDescription: `Expense settlement: ${expense.id}`,
        txnRefId: expense.id,
        txnRefType: TransactionRefType.EXPENSE,
        txnType: TransactionType.OUT,
        txnDate: new Date(expense.expenseDate.getTime() + 2 * 60 * 60 * 1000),
      }),
    );

    expense.settle({
      settledBy: { id: request.settledById },
      accountId: request.accountId,
      transactionId: transactionRef,
    });

    const updated = await this.expenseRepository.update(expense.id, expense);
    const events = [...updated.domainEvents];
    updated.clearEvents();
    this.eventBus.publishAll(events);
    return updated;
  }
}

