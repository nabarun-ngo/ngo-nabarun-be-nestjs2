import { Inject, Injectable } from '@nestjs/common';
import { QueueHandler, IQueueHandler, Job } from '@nabarun-ngo/nestjs-shared-queue';
import { DonationStatus } from '../../domain/enums/donation-status.enum';
import { IDonationRepository } from '../../domain/repositories/donation.repository';
import { MarkDonationPendingJob } from './mark-donation-pending.job';

@Injectable()
@QueueHandler(MarkDonationPendingJob, { attempts: 3, backoff: { type: 'exponential', delay: 30_000 } })
export class MarkDonationPendingHandler implements IQueueHandler<MarkDonationPendingJob> {
  constructor(@Inject(IDonationRepository) private readonly donationRepository: IDonationRepository) { }

  async execute(job: Job<MarkDonationPendingJob>): Promise<void> {
    const donationId = job.data.payload?.donationId;
    let raised;
    if (donationId) {
      const donation = await this.donationRepository.findById(donationId);
      raised = donation?.status === DonationStatus.RAISED ? [donation] : [];
    } else {
      raised = await this.donationRepository.findAll({ status: [DonationStatus.RAISED] });
    }

    for (const donation of raised) {
      donation.markAsPending();
      await this.donationRepository.update(donation.id, donation);
      job.log?.('Donation ' + donation.id + ' marked pending');
    }
  }
}

