import { IRepository } from '@ce/nestjs-shared-core';
import { Account } from '../aggregates/account/account.aggregate';
import { AccountStatus } from '../enums/account-status.enum';
import { AccountType } from '../enums/account-type.enum';

export interface AccountFilter {
  id?: string;
  type?: AccountType[];
  status?: AccountStatus[];
  accountHolderName?: string;
  accountHolderId?: string;
  includeBalance?: boolean;
}

export const IAccountRepository = Symbol('IAccountRepository');

export interface IAccountRepository extends IRepository<Account, string, AccountFilter> {}
