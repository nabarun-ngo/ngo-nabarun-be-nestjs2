import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserDeletedEvent } from '../../../../user/domain/events/user-deleted.event';
import { Donation } from '../../../domain/aggregates/donation/donation.aggregate';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class OnUserDeletedFinanceHandler implements IEventHandler<UserDeletedEvent> {
  private readonly logger = new Logger(OnUserDeletedFinanceHandler.name);

  constructor(@Inject(IDonationRepository) private readonly donationRepository: IDonationRepository) {}

  async handle(event: UserDeletedEvent): Promise<void> {
    this.logger.log('Cancelling outstanding donations for user ' + event.userId);
    const donations = await this.donationRepository.findAll({
      donorId: event.userId,
      status: Donation.outstandingStatus,
    });
    for (const donation of donations) {
      donation.cancel();
      await this.donationRepository.update(donation.id, donation);
      this.logger.debug('Cancelled donation ' + donation.id);
    }
  }
}

