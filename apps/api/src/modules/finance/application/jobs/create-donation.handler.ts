import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { QueueHandler, IQueueHandler, Job } from '@nabarun-ngo/nestjs-shared-queue';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { DonationType } from '../../domain/enums/donation-type.enum';
import { CreateDonationCommand } from '../commands/create-donation/create-donation.command';
import { CreateDonationJob } from './create-donation.job';

@Injectable()
@QueueHandler(CreateDonationJob, { attempts: 3, backoff: { type: 'exponential', delay: 30_000 } })
export class CreateDonationJobHandler implements IQueueHandler<CreateDonationJob> {
  private readonly logger = new Logger(CreateDonationJobHandler.name);

  constructor(private readonly commandBus: CommandBus) { }

  async execute(job: Job<CreateDonationJob>): Promise<void> {
    const { userId, fullName, amount, firstDate, lastDate } = job.data.payload;
    try {
      const donation = await this.commandBus.execute(
        new CreateDonationCommand({
          type: DonationType.REGULAR,
          amount,
          donorId: userId,
          startDate: new Date(firstDate),
          endDate: new Date(lastDate),
          isGuest: false,
        }),
      );
      job.log?.('Monthly donation ' + donation.id + ' raised for ' + fullName);
    } catch (error) {
      if (error instanceof BusinessException) {
        job.log?.('Skipping user ' + fullName + ': ' + error.message);
        return;
      }
      throw error;
    }
  }
}

