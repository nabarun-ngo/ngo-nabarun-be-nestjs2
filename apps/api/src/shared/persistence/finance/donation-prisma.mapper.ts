import { FinanceUserRef } from '../../../modules/finance/domain/types/finance-user-ref';
import { Donation } from '../../../modules/finance/domain/aggregates/donation/donation.aggregate';
import { DonationType } from '../../../modules/finance/domain/enums/donation-type.enum';
import { DonationStatus } from '../../../modules/finance/domain/enums/donation-status.enum';
import { PaymentMethod } from '../../../modules/finance/domain/enums/payment-method.enum';
import { UPIPaymentType } from '../../../modules/finance/domain/enums/upi-payment-type.enum';
import { Prisma } from '../prisma/client';
import { MapperUtils } from './mapper-utils';
import { FullDonation } from './donation.prisma-repository';
import { AccountPrismaMapper } from './account-prisma.mapper';

export class DonationPrismaMapper {
  static toDonationDomain(p: FullDonation): Donation | null {
    if (!p) return null;

    const confirmedBy: FinanceUserRef | undefined = p.confirmedBy
      ? {
        id: p.confirmedBy.id,
        email: p.confirmedBy.email ?? undefined,
        firstName: p.confirmedBy.firstName,
        lastName: p.confirmedBy.lastName,
      }
      : undefined;

    return new Donation(
      p.id,
      p.type as DonationType,
      Number(p.amount),
      p.currency,
      p.status as DonationStatus,
      MapperUtils.nullToUndefined(p.donorId),
      p.donorName ?? `${p.donor?.firstName ?? ''} ${p.donor?.lastName ?? ''}`.trim(),
      MapperUtils.nullToUndefined(p.donorEmail ?? p.donor?.email),
      MapperUtils.nullToUndefined(p.donorPhone),
      p.raisedOn,
      MapperUtils.nullToUndefined(p.paidOn),
      MapperUtils.nullToUndefined(p.transactionRef),
      p.isGuest ?? false,
      MapperUtils.nullToUndefined(p.startDate),
      MapperUtils.nullToUndefined(p.endDate),
      confirmedBy,
      MapperUtils.nullToUndefined(p.confirmedOn),
      MapperUtils.nullToUndefined(p.paymentMethod) as PaymentMethod,
      MapperUtils.nullToUndefined(
        AccountPrismaMapper.toAccountDomain(p.paidToAccount as any),
      ),
      MapperUtils.nullToUndefined(p.forEventId),
      MapperUtils.nullToUndefined(p.activity?.name ?? null),
      MapperUtils.nullToUndefined(p.paidUsingUPI) as UPIPaymentType,
      p.isPaymentNotified ?? false,
      MapperUtils.nullToUndefined(p.remarks),
      MapperUtils.nullToUndefined(p.cancelletionReason),
      MapperUtils.nullToUndefined(p.laterPaymentReason),
      MapperUtils.nullToUndefined(p.paymentFailureDetail),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toDonationCreatePersistence(domain: Donation): Prisma.DonationUncheckedCreateInput {
    return {
      id: domain.id,
      type: domain.type,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      donorId: MapperUtils.undefinedToNull(domain.donorId),
      donorName: MapperUtils.undefinedToNull(domain.donorName),
      donorEmail: MapperUtils.undefinedToNull(domain.donorEmail),
      donorPhone: MapperUtils.undefinedToNull(domain.donorNumber),
      isGuest: domain.isGuest,
      startDate: MapperUtils.undefinedToNull(domain.startDate),
      endDate: MapperUtils.undefinedToNull(domain.endDate),
      raisedOn: domain.raisedOn,
      paidOn: MapperUtils.undefinedToNull(domain.paidOn),
      transactionRef: MapperUtils.undefinedToNull(domain.transactionRef),
      confirmedById: MapperUtils.undefinedToNull(domain.confirmedBy?.id),
      confirmedOn: MapperUtils.undefinedToNull(domain.confirmedOn),
      paymentMethod: MapperUtils.undefinedToNull(domain.paymentMethod),
      paidToAccountId: MapperUtils.undefinedToNull(domain.paidToAccount?.id),
      forEventId: MapperUtils.undefinedToNull(domain.forEventId),
      paidUsingUPI: MapperUtils.undefinedToNull(domain.paidUsingUPI),
      isPaymentNotified: domain.isPaymentNotified,
      remarks: MapperUtils.undefinedToNull(domain.remarks),
      cancelletionReason: MapperUtils.undefinedToNull(domain.cancelletionReason),
      laterPaymentReason: MapperUtils.undefinedToNull(domain.laterPaymentReason),
      paymentFailureDetail: MapperUtils.undefinedToNull(domain.paymentFailureDetail),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toDonationUpdatePersistence(domain: Donation): Prisma.DonationUncheckedUpdateInput {
    return {
      status: domain.status,
      amount: domain.amount,
      paidOn: MapperUtils.undefinedToNull(domain.paidOn),
      transactionRef: MapperUtils.undefinedToNull(domain.transactionRef),
      confirmedById: MapperUtils.undefinedToNull(domain.confirmedBy?.id),
      confirmedOn: MapperUtils.undefinedToNull(domain.confirmedOn),
      paymentMethod: MapperUtils.undefinedToNull(domain.paymentMethod),
      paidToAccountId: MapperUtils.undefinedToNull(domain.paidToAccount?.id),
      paidUsingUPI: MapperUtils.undefinedToNull(domain.paidUsingUPI),
      isPaymentNotified: domain.isPaymentNotified,
      remarks: MapperUtils.undefinedToNull(domain.remarks),
      cancelletionReason: MapperUtils.undefinedToNull(domain.cancelletionReason),
      laterPaymentReason: MapperUtils.undefinedToNull(domain.laterPaymentReason),
      paymentFailureDetail: MapperUtils.undefinedToNull(domain.paymentFailureDetail),
      updatedAt: domain.updatedAt,
    };
  }
}
