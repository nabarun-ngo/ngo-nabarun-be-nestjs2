import { DonationType } from '../../../domain/enums/donation-type.enum';

export class CreateDonationCommand {
  constructor(
    public readonly params: {
      type: DonationType;
      amount: number;
      donorId?: string;
      donorName?: string;
      donorNumber?: string;
      donorEmail?: string;
      isGuest: boolean;
      startDate?: Date;
      endDate?: Date;
      forEventId?: string;
    },
  ) {}
}

