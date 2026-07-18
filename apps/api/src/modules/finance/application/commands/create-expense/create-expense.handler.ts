import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Expense } from '../../../domain/aggregates/expense/expense.aggregate';
import { ExpenseItem } from '../../../domain/value-objects/expense-item.vo';
import { IExpenseRepository } from '../../../domain/repositories/expense.repository';
import { CreateExpenseCommand } from './create-expense.command';

@CommandHandler(CreateExpenseCommand)
@Injectable()
export class CreateExpenseHandler implements ICommandHandler<CreateExpenseCommand, Expense> {
  constructor(
    @Inject(IExpenseRepository) private readonly expenseRepository: IExpenseRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: request }: CreateExpenseCommand): Promise<Expense> {
    const expenseItems = (request.expenseItems ?? []).map(
      (item) => new ExpenseItem(item.itemName, undefined, item.amount),
    );
    const expense = Expense.create({
      name: request.name,
      description: request.description || '',
      requestedBy: { id: request.requestedById },
      paidBy: { id: request.paidById },
      referenceId: request.expenseRefId,
      referenceType: request.expenseRefType,
      expenseDate: request.expenseDate,
      currency: request.currency,
      expenseItems,
    });
    const saved = await this.expenseRepository.create(expense);
    const events = [...saved.domainEvents];
    saved.clearEvents();
    this.eventBus.publishAll(events);
    return saved;
  }
}

