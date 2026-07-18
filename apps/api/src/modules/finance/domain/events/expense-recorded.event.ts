import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type ExpenseRecordedSnapshot = {
  readonly expenseId: string;
  readonly amount: number;
  readonly requestedById?: string;
};

export class ExpenseRecordedEvent extends DomainEvent<ExpenseRecordedSnapshot> {
  constructor(expenseId: string, amount: number, requestedById?: string) {
    super(expenseId, { expenseId, amount, requestedById });
  }
}
