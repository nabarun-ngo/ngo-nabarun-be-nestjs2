import { DonationStatus } from '../../../domain/enums/donation-status.enum';
import { DonationType } from '../../../domain/enums/donation-type.enum';

export class ListDonationsQuery {
  constructor(
    public readonly filter: {
      donationId?: string;
      donorId?: string;
      donorName?: string;
      status?: DonationStatus[];
      type?: DonationType[];
      isGuest?: 'Y' | 'N';
      startDate?: Date;
      endDate?: Date;
    } = {},
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
  ) {}
}

