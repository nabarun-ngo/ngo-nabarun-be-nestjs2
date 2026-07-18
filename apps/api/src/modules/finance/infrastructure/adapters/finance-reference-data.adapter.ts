import { Injectable, Logger } from '@nestjs/common';
import { JsonStoreFacade } from '@nabarun-ngo/nestjs-shared-json-store';
import { IFinanceReferenceDataPort, KeyValueOption } from '../../application/ports/finance-reference-data.port';
import { FinanceReferenceDataPayloadSchema } from '../../finance-reference-data.schema';

@Injectable()
export class FinanceReferenceDataAdapter implements IFinanceReferenceDataPort {
  private static readonly NAMESPACE = 'finance-reference-data';
  private readonly logger = new Logger(FinanceReferenceDataAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) { }

  async getDonationReferenceData(): Promise<Record<string, KeyValueOption[]>> {
    const [donationStatuses, donationTypes, paymentMethods, upiOptions] = await Promise.all([
      this.loadItems('donation-statuses'),
      this.loadItems('donation-types'),
      this.loadItems('payment-methods'),
      this.loadItems('upi-options'),
    ]);
    return { donationStatuses, donationTypes, paymentMethods, upiOptions };
  }

  async getExpenseReferenceData(): Promise<Record<string, KeyValueOption[]>> {
    const [expenseStatuses, expenseRefTypes] = await Promise.all([
      this.loadItems('expense-statuses'),
      this.loadItems('expense-categories'),
    ]);
    return { expenseStatuses, expenseRefTypes };
  }

  async getAccountReferenceData(): Promise<Record<string, KeyValueOption[]>> {
    const [accountStatuses, accountTypes, transactionRefTypes] = await Promise.all([
      this.loadItems('account-statuses'),
      this.loadItems('account-types'),
      this.loadItems('transaction-types'),
    ]);
    return { accountStatuses, accountTypes, transactionRefTypes };
  }

  async getEarningReferenceData(): Promise<Record<string, KeyValueOption[]>> {
    const [earningStatuses, earningCategories] = await Promise.all([
      this.loadItems('earning-statuses'),
      this.loadItems('earning-categories'),
    ]);
    return { earningStatuses, earningCategories };
  }

  private async loadItems(key: string): Promise<KeyValueOption[]> {
    const payload = await this.jsonStore.get(key, FinanceReferenceDataAdapter.NAMESPACE);
    if (!payload) return [];
    const parsed = FinanceReferenceDataPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid finance-reference-data payload for ${key}`);
      return [];
    }
    return parsed.data.items;
  }
}

