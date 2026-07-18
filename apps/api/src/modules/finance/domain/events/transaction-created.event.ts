import { DomainEvent } from '@ce/nestjs-shared-core';

export type TransactionCreatedSnapshot = {
  readonly transactionId: string;
  readonly transactionRef: string;
  readonly accountId?: string;
  readonly amount: number;
  readonly type: string;
};

export class TransactionCreatedEvent extends DomainEvent<TransactionCreatedSnapshot> {
  constructor(
    transactionId: string,
    transactionRef: string,
    accountId: string | undefined,
    amount: number,
    type: string,
  ) {
    super(transactionId, { transactionId, transactionRef, accountId, amount, type });
  }
}
