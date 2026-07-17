import { AccountStatus } from '../../../domain/enums/account-status.enum';

export class UpdateAccountCommand {
  constructor(
    public readonly params: {
      id: string;
      name?: string;
      description?: string;
      accountStatus?: AccountStatus;
      bankDetail?: {
        bankAccountHolderName?: string;
        bankName?: string;
        bankBranch?: string;
        bankAccountNumber?: string;
        bankAccountType?: string;
        IFSCNumber?: string;
      };
      upiDetail?: {
        payeeName?: string;
        upiId?: string;
        mobileNumber?: string;
        qrData?: string;
      };
      actorUserId?: string;
    },
  ) {}
}

