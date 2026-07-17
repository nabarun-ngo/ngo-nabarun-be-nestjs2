import { EarningCategory, EarningStatus } from '../../../domain/enums/earning.enum';

export class ListEarningsQuery {
  constructor(
    public readonly filter: {
      status?: EarningStatus[];
      category?: EarningCategory[];
      source?: string;
      referenceId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
  ) {}
}

