import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';

export class BankDetail {
  constructor(
    public bankAccountHolderName?: string,
    public bankName?: string,
    public bankBranch?: string,
    public bankAccountNumber?: string,
    public bankAccountType?: string,
    public IFSCNumber?: string,
  ) { }
}
