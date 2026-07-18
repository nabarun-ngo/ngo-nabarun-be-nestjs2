export interface KeyValueOption {
  key: string;
  value: string;
  description?: string;
}

export const IFinanceReferenceDataPort = Symbol('IFinanceReferenceDataPort');

export interface IFinanceReferenceDataPort {
  getDonationReferenceData(): Promise<Record<string, KeyValueOption[]>>;
  getExpenseReferenceData(): Promise<Record<string, KeyValueOption[]>>;
  getAccountReferenceData(): Promise<Record<string, KeyValueOption[]>>;
  getEarningReferenceData(): Promise<Record<string, KeyValueOption[]>>;
}
