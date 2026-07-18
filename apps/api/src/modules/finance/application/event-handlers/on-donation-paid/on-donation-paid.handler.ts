import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  CorrespondenceRequestEvent,
  formatDate,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '@nabarun-ngo/nestjs-shared-core';
import { DonationPaidEvent } from '../../../domain/events/donation-paid.event';
import { financeUserFullName } from '../../../domain/types/finance-user-ref';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DonationMapper } from '../../mappers/donation.mapper';

@Injectable()
@EventsHandler(DonationPaidEvent)
export class OnDonationPaidHandler implements IEventHandler<DonationPaidEvent> {
  private readonly logger = new Logger(OnDonationPaidHandler.name);

  constructor(
    @Inject(IDonationRepository) private readonly donationRepository: IDonationRepository,
    private readonly eventBus: EventBus,
  ) { }

  async handle(event: DonationPaidEvent): Promise<void> {
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
    const paidOn = donation.paidOn ? formatDate(donation.paidOn) : 'Not Applicable';
    const confirmedByName = financeUserFullName(
      donation.confirmedBy as import('../../../domain/types/finance-user-ref').FinanceUserRef | undefined,
    );

    if (!donation.donorId) {
      this.eventBus.publish(
        new CorrespondenceRequestEvent({
          recipients: { mode: 'users', userIds: [] },
          channels: {
            email: {
              templateKey: 'DONATION_PAID',
              templateData: { donation: donationDto, donationPeriod, paidOn, confirmedByName },
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
            title: 'Donation payment confirmed',
            body: `Your donation of ${donation.amount} ${donation.currency} for ${donationPeriod} was marked paid on ${paidOn}.`,
            type: NotificationType.INFO,
            category: NotificationCategory.DONATION,
            priority: NotificationPriority.HIGH,
            referenceId: donation.id,
            referenceType: 'donation',
            metadata: { donation: donationDto },
          },
          email: {
            templateKey: 'DONATION_PAID',
            templateData: { donation: donationDto, donationPeriod, paidOn, confirmedByName },
            overrideEmails: [donation.donorEmail],
          },
          push: { enabled: true },
        },
      }),
    );
  }
}
