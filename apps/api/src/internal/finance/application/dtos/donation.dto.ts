import { DonationStatus } from '../../domain/enums/donation-status.enum';
import { DonationType } from '../../domain/enums/donation-type.enum';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { UPIPaymentType } from '../../domain/enums/upi-payment-type.enum';
import { AccountDetailDto } from './account.dto';
import { FinanceUserDto } from './finance-user.dto';
import { KeyValueOption } from '../ports/finance-reference-data.port';

export class DonationDto {
  id!: string;
  isGuest!: boolean;
  amount!: number;
  currency!: string;
  donorId!: string;
  donorName!: string;
  donorEmail?: string;
  donorNumber?: string;
  startDate?: Date;
  endDate?: Date;
  raisedOn!: Date;
  type!: DonationType;
  status!: DonationStatus;
  paidOn?: Date;
  confirmedBy?: FinanceUserDto;
  confirmedOn?: Date;
  paymentMethod?: PaymentMethod;
  paidToAccount?: AccountDetailDto;
  forEvent?: string;
  paidUsingUPI?: UPIPaymentType;
  isPaymentNotified?: boolean;
  transactionRef?: string;
  remarks?: string;
  cancelletionReason?: string;
  laterPaymentReason?: string;
  paymentFailureDetail?: string;
  nextStatuses!: DonationStatus[];
  activityId?: string;
  activityName?: string;
}

export class DonationSummaryDto {
  hasOutstanding!: boolean;
  outstandingMonths!: string[];
  outstandingAmount!: number;
}

export class DonationRefDataDto {
  donationStatuses?: KeyValueOption[];
  donationTypes?: KeyValueOption[];
  paymentMethods?: KeyValueOption[];
  upiOptions?: KeyValueOption[];
}
