import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { ExpenseRefType } from '../../../../finance/domain/enums/expense.enum';
import { IExpenseRepository } from '../../../../finance/domain/repositories/expense.repository';
import { IActivityRepository } from '../../../domain/repositories/activity.repository';
import { LinkExpenseToActivityCommand } from './link-expense-to-activity.command';

@CommandHandler(LinkExpenseToActivityCommand)
@Injectable()
export class LinkExpenseToActivityHandler implements ICommandHandler<LinkExpenseToActivityCommand, void> {
  constructor(
    @Inject(IActivityRepository) private readonly activityRepository: IActivityRepository,
    @Inject(IExpenseRepository) private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute({ params }: LinkExpenseToActivityCommand): Promise<void> {
    const activity = await this.activityRepository.findById(params.activityId);
    if (!activity) throw new BusinessException('Activity not found');
    const expense = await this.expenseRepository.findById(params.expenseId);
    if (!expense) throw new BusinessException('Expense not found');
    expense.linkToReference(params.activityId, ExpenseRefType.EVENT, activity.name);
    await this.expenseRepository.update(params.expenseId, expense);
  }
}
