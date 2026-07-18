import { EarningCategory } from '../../../domain/enums/earning.enum';

export class CreateEarningCommand {
  constructor(
    public readonly params: {
      userId: string;
      category: EarningCategory;
      amount: number;
      currency: string;
      source: string;
      description?: string;
    },
  ) {}
}

