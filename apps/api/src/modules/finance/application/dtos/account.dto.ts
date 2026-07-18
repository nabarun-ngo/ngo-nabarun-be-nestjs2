import { AccountStatus } from '../../domain/enums/account-status.enum';
import { AccountType } from '../../domain/enums/account-type.enum';
import { KeyValueOption } from '../ports/finance-reference-data.port';

export class BankDetailDto {
  bankAccountHolderName?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAccountType?: string;
  IFSCNumber?: string;
}

export class UPIDetailDto {
  payeeName?: string;
  upiId?: string;
  mobileNumber?: string;
  qrData?: string;
}

export class AccountDetailDto {
  id!: string;
  accountHolderName?: string;
  accountHolder?: string;
  balance?: number;
  accountStatus!: AccountStatus;
  activatedOn?: Date;
  accountType!: AccountType;
  bankDetail?: BankDetailDto;
  upiDetail?: UPIDetailDto;
}

export class AccountRefDataDto {
  accountStatuses?: KeyValueOption[];
  accountTypes?: KeyValueOption[];
  transactionRefTypes?: KeyValueOption[];
}
