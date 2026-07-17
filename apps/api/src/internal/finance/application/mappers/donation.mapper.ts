import { Donation } from '../../domain/aggregates/donation/donation.aggregate';
import { Account } from '../../domain/aggregates/account/account.aggregate';
import { DonationDto } from '../dtos/donation.dto';
import { AccountMapper } from './account.mapper';
import { FinanceUserMapper } from './finance-user.mapper';

export class DonationMapper {
  static toDto(donation: Donation): DonationDto {
    return {
      id: donation.id,
      type: donation.type,
      amount: donation.amount,
      currency: donation.currency,
      status: donation.status,
      donorId: donation.donorId!,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorNumber: donation.donorNumber,
      isGuest: donation.isGuest,
      startDate: donation.startDate,
      endDate: donation.endDate,
      raisedOn: donation.raisedOn,
      paidOn: donation.paidOn,
      confirmedBy: FinanceUserMapper.toDto(donation.confirmedBy),
      confirmedOn: donation.confirmedOn,
      paymentMethod: donation.paymentMethod,
      paidToAccount: donation.paidToAccount
        ? AccountMapper.toDto(donation.paidToAccount as Account, { includeBankDetail: false, includeUpiDetail: false })
        : undefined,
      paidUsingUPI: donation.paidUsingUPI,
      isPaymentNotified: donation.isPaymentNotified,
      transactionRef: donation.transactionRef,
      remarks: donation.remarks,
      cancelletionReason: donation.cancelletionReason,
      laterPaymentReason: donation.laterPaymentReason,
      paymentFailureDetail: donation.paymentFailureDetail,
      nextStatuses: donation.nextStatus(),
      activityId: donation.forEventId,
      activityName: donation.activityName,
    };
  }
}

