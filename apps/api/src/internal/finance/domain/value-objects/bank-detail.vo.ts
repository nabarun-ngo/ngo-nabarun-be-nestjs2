import { BusinessException } from '@ce/nestjs-shared-core';

export class BankDetail {
  constructor(
    public bankAccountHolderName?: string,
    public bankName?: string,
    public bankBranch?: string,
    public bankAccountNumber?: string,
    public bankAccountType?: string,
    public IFSCNumber?: string,
  ) {}
}
