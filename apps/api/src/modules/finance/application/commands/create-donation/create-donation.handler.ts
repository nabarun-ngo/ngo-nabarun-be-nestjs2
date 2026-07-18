import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Donation } from '../../../domain/aggregates/donation/donation.aggregate';
import { DonationStatus } from '../../../domain/enums/donation-status.enum';
import { DonationType } from '../../../domain/enums/donation-type.enum';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { CreateDonationCommand } from './create-donation.command';

@CommandHandler(CreateDonationCommand)
@Injectable()
export class CreateDonationHandler implements ICommandHandler<CreateDonationCommand, Donation> {
  constructor(
    @Inject(IDonationRepository) private readonly donationRepository: IDonationRepository,
    private readonly eventBus: EventBus,
  ) { }

  async execute({ params: request }: CreateDonationCommand): Promise<Donation> {
    const donation = Donation.create({
      type: request.type,
      amount: request.amount,
      donorId: request.donorId!,
      startDate: request.startDate,
      endDate: request.endDate,
      donorName: request.donorName!,
      donorNumber: request.donorNumber,
      donorEmail: request.donorEmail,
      isGuest: request.isGuest,
    });

    if (request.forEventId) {
      donation.update({ forEventId: request.forEventId });
    }

    if (request.type === DonationType.REGULAR) {
      const donations = await this.donationRepository.findAll({
        type: [DonationType.REGULAR],
        donorId: request.donorId,
        startDate_lte: request.endDate,
        endDate_gte: request.startDate,
        status: [...Donation.outstandingStatus, DonationStatus.PAID],
      });
      if (donations.length > 0) {
        throw new BusinessException('Donation already exists for this donor in the given period');
      }
    }

    const saved = await this.donationRepository.create(donation);
    const events = [...donation.domainEvents];
    donation.clearEvents();
    this.eventBus.publishAll(events);
    return saved;
  }
}

