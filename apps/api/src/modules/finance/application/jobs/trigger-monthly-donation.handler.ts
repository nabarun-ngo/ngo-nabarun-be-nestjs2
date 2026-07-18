import { Inject, Injectable, Logger } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job, JobExecutionContext } from '@nabarun-ngo/nestjs-shared-queue';
import { IFinanceDonationSchedulePort } from '../ports/finance-donation-schedule.port';
import { FINANCE_OPTIONS } from '../../infrastructure/finance-options.token';
import type { FinanceModuleOptions } from '../../finance.schema';
import { CreateDonationJob } from './create-donation.job';
import { TriggerMonthlyDonationJob } from './trigger-monthly-donation.job';

@Injectable()
@QueueHandler(TriggerMonthlyDonationJob, { attempts: 3, backoff: { type: 'exponential', delay: 30_000 } })
export class TriggerMonthlyDonationHandler implements IQueueHandler<TriggerMonthlyDonationJob> {
  private readonly logger = new Logger(TriggerMonthlyDonationHandler.name);

  constructor(
    @Inject(IFinanceDonationSchedulePort) private readonly schedulePort: IFinanceDonationSchedulePort,
    @Inject(FINANCE_OPTIONS) private readonly options: FinanceModuleOptions,
  ) { }

  async execute(job: Job<TriggerMonthlyDonationJob>, ctx: JobExecutionContext): Promise<void> {
    const userId = job.data.payload?.userId;
    const users = await this.schedulePort.findActiveDonors(userId);

    const today = new Date();
    const firstDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const defaultAmount = this.options.defaultDonationAmount;

    for (const user of users) {
      if (
        user.donationPauseStart && user.donationPauseEnd &&
        user.donationPauseStart <= today && user.donationPauseEnd >= today
      ) {
        job.log?.('Skipping paused user ' + user.id);
        continue;
      }
      const amount = user.donationAmount && user.donationAmount > 0 ? user.donationAmount : defaultAmount;
      ctx.addChildJob('CreateDonationJob', {
        payload: {
          userId: user.id,
          fullName: user.fullName,
          amount,
          firstDate: firstDate.toISOString(),
          lastDate: lastDate.toISOString(),
        },
      });
    }
  }
}

