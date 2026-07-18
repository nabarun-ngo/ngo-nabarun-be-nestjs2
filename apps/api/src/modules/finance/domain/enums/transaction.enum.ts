export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  REVERSED = 'REVERSED',
}

export enum TransactionRefType {
  DONATION = 'DONATION',
  NONE = 'NONE',
  EXPENSE = 'EXPENSE',
  EARNING = 'EARNING',
  TXN_REVERSE = 'TXN_REVERSE',
}
