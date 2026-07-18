import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type AccountCreatedSnapshot = {
  readonly accountId: string;
  readonly name: string;
  readonly type: string;
};

export class AccountCreatedEvent extends DomainEvent<AccountCreatedSnapshot> {
  constructor(accountId: string, name: string, type: string) {
    super(accountId, { accountId, name, type });
  }
}
