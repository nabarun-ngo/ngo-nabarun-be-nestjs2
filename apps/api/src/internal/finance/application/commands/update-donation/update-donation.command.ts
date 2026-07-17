import { DonationStatus } from '../../../domain/enums/donation-status.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { UPIPaymentType } from '../../../domain/enums/upi-payment-type.enum';

export class UpdateDonationCommand {
  constructor(
    public readonly params: {
      id: string;
      status?: DonationStatus;
      remarks?: string;
      amount?: number;
      forEvent?: string;
      paidToAccountId?: string;
      confirmedById?: string;
      paidUsingUPI?: UPIPaymentType;
      paymentMethod?: PaymentMethod;
      paidOn?: Date;
      transactionRef?: string;
      isPaymentNotified?: boolean;
    },
  ) {}
}

