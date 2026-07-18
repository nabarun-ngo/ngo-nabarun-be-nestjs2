import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { Donation } from '../../../domain/aggregates/donation/donation.aggregate';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { ProcessDonationPaymentCommand } from './process-donation-payment.command';

@CommandHandler(ProcessDonationPaymentCommand)
@Injectable()
export class ProcessDonationPaymentHandler implements ICommandHandler<ProcessDonationPaymentCommand, Donation> {
  constructor(
    @Inject(IDonationRepository) private readonly donationRepository: IDonationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: request }: ProcessDonationPaymentCommand): Promise<Donation> {
    const donation = await this.donationRepository.findById(request.donationId);
    if (!donation) throw new BusinessException('Donation not found with id: ' + request.donationId);
    if (!donation.canBePaid()) {
      throw new BusinessException('Donation cannot be paid in current status: ' + donation.status);
    }
    if (request.isPaymentNotified) donation.markPaymentNotified();
    const updated = await this.donationRepository.update(donation.id, donation);
    const events = [...updated.domainEvents];
    updated.clearEvents();
    this.eventBus.publishAll(events);
    return updated;
  }
}

