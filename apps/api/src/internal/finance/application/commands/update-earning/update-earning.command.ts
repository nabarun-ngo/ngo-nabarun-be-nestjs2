import { EarningCategory, EarningStatus } from '../../../domain/enums/earning.enum';

export class UpdateEarningCommand {
  constructor(
    public readonly params: {
      id: string;
      userId: string;
      category?: EarningCategory;
      amount?: number;
      description?: string;
      source?: string;
      earningDate?: Date;
      status?: EarningStatus;
      accountId?: string;
    },
  ) {}
}

