export class CreateDonationJob {
  constructor(
    public readonly payload: {
      userId: string;
      fullName: string;
      amount: number;
      firstDate: string;
      lastDate: string;
    },
  ) {}
}

