export class ProcessDonationPaymentCommand {
  constructor(
    public readonly params: {
      donationId: string;
      isPaymentNotified?: boolean;
    },
  ) {}
}

