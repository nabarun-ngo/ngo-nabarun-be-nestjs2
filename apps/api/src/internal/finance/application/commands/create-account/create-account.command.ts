import { AccountType } from '../../../domain/enums/account-type.enum';

export class CreateAccountCommand {
  constructor(
    public readonly params: {
      name: string;
      type: AccountType;
      currency: string;
      description?: string;
      accountHolderId: string;
    },
  ) {}
}

