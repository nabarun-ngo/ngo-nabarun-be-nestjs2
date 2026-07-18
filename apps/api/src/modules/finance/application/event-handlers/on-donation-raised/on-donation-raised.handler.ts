import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  CorrespondenceRequestEvent,
  formatDate,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '@nabarun-ngo/nestjs-shared-core';
import { DonationRaisedEvent } from '../../../domain/events/donation-raised.event';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DonationMapper } from '../../mappers/donation.mapper';

@Injectable()
@EventsHandler(DonationRaisedEvent)
export class OnDonationRaisedHandler implements IEventHandler<DonationRaisedEvent> {
  private readonly logger = new Logger(OnDonationRaisedHandler.name);

  constructor(
    @Inject(IDonationRepository) private readonly donationRepository: IDonationRepository,
    private readonly eventBus: EventBus,
  ) { }

  async handle(event: DonationRaisedEvent): Promise<void> {
    const donation = await this.donationRepository.findById(event.donationId);
    if (!donation?.donorEmail) {
      this.logger.warn('No donor email for donation ' + donation?.id);
      return;
    }

    const donationDto = DonationMapper.toDto(donation);
    const donationPeriod =
      donation.startDate && donation.endDate
        ? formatDate(donation.startDate) + ' - ' + formatDate(donation.endDate)
        : 'Not Applicable';

    if (!donation.donorId) {
      this.eventBus.publish(
        new CorrespondenceRequestEvent({
          recipients: { mode: 'users', userIds: [] },
          channels: {
            email: {
              templateKey: 'DONATION_CREATED',
              templateData: { donation: donationDto, donationPeriod },
              overrideEmails: [donation.donorEmail],
            },
          },
        }),
      );
      return;
    }

    this.eventBus.publish(
      new CorrespondenceRequestEvent({
        recipients: { mode: 'users', userIds: [donation.donorId] },
        channels: {
          inApp: {
            title: 'Donation raised',
            body: `Your donation of ${donation.amount} ${donation.currency} has been raised for ${donationPeriod}.`,
            type: NotificationType.INFO,
            category: NotificationCategory.DONATION,
            priority: NotificationPriority.HIGH,
            referenceId: donation.id,
            referenceType: 'donation',
            metadata: { donation: donationDto },
          },
          email: {
            templateKey: 'DONATION_CREATED',
            templateData: { donation: donationDto, donationPeriod },
            overrideEmails: [donation.donorEmail],
          },
          push: { enabled: true },
        },
      }),
    );
  }
}
