import { Inject, Injectable } from '@nestjs/common';
import { IFinanceReferenceDataPort, KeyValueOption } from '../ports/finance-reference-data.port';

export interface FinanceReportReferenceData {
  acc_type: KeyValueOption[];
  donationType: KeyValueOption[];
  donationStatus: KeyValueOption[];
  paymentMethod: KeyValueOption[];
  upiOption: KeyValueOption[];
  earn_categories: KeyValueOption[];
  earn_status: KeyValueOption[];
  exp_categories: KeyValueOption[];
  exp_status: KeyValueOption[];
}

@Injectable()
export class FinanceReportReferenceDataService {
  constructor(
    @Inject(IFinanceReferenceDataPort)
    private readonly referenceDataPort: IFinanceReferenceDataPort,
  ) {}

  async getReferenceData(): Promise<FinanceReportReferenceData> {
    const [donationRef, expenseRef, accountRef, earningRef] = await Promise.all([
      this.referenceDataPort.getDonationReferenceData(),
      this.referenceDataPort.getExpenseReferenceData(),
      this.referenceDataPort.getAccountReferenceData(),
      this.referenceDataPort.getEarningReferenceData(),
    ]);

    return {
      acc_type: accountRef.accountTypes ?? [],
      donationType: donationRef.donationTypes ?? [],
      donationStatus: donationRef.donationStatuses ?? [],
      paymentMethod: donationRef.paymentMethods ?? [],
      upiOption: donationRef.upiOptions ?? [],
      earn_categories: earningRef.earningCategories ?? [],
      earn_status: earningRef.earningStatuses ?? [],
      exp_categories: expenseRef.expenseRefTypes ?? [],
      exp_status: expenseRef.expenseStatuses ?? [],
    };
  }
}
