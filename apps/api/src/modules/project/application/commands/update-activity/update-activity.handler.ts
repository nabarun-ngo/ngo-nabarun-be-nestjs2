import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { ActivityStatus } from '../../../domain/enums/activity.enum';
import { Activity } from '../../../domain/aggregates/activity/activity.aggregate';
import { IActivityRepository } from '../../../domain/repositories/activity.repository';
import { ExpenseStatus } from '../../../../finance/domain/enums/expense.enum';
import { DonationStatus } from '../../../../finance/domain/enums/donation-status.enum';
import { IExpenseRepository } from '../../../../finance/domain/repositories/expense.repository';
import { IDonationRepository } from '../../../../finance/domain/repositories/donation.repository';
import { UpdateActivityCommand } from './update-activity.command';

@CommandHandler(UpdateActivityCommand)
@Injectable()
export class UpdateActivityHandler implements ICommandHandler<UpdateActivityCommand, Activity> {
  constructor(
    @Inject(IActivityRepository) private readonly activityRepository: IActivityRepository,
    @Inject(IExpenseRepository) private readonly expenseRepository: IExpenseRepository,
    @Inject(IDonationRepository) private readonly donationRepository: IDonationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params }: UpdateActivityCommand): Promise<Activity> {
    const activity = await this.activityRepository.findById(params.activityId);
    if (!activity) throw new BusinessException('Activity not found');
    activity.update(params);
    if (params.status) {
      if (params.status === ActivityStatus.COMPLETED) {
        const expenses = await this.expenseRepository.findAll({ expenseRefId: params.activityId });
        const allowedExpense = [ExpenseStatus.SETTLED, ExpenseStatus.REJECTED];
        if (expenses.some((e) => !allowedExpense.includes(e.status))) {
          throw new BusinessException('Cannot close activity because there are unsettled expenses.');
        }
        const donations = await this.donationRepository.findAll({ forEventId: params.activityId });
        const allowedDonation = [DonationStatus.PAID, DonationStatus.CANCELLED];
        if (donations.some((d) => !allowedDonation.includes(d.status))) {
          throw new BusinessException('Cannot close activity because there are unsettled donations.');
        }
      }
      activity.updateStatus(params.status);
    }
    const saved = await this.activityRepository.update(params.activityId, activity);
    const events = [...activity.domainEvents];
    activity.clearEvents();
    this.eventBus.publishAll(events);
    return saved;
  }
}
