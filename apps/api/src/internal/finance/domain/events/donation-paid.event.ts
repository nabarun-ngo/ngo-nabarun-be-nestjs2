import { DomainEvent } from '@ce/nestjs-shared-core';

export type DonationPaidSnapshot = {
  readonly donationId: string;
  readonly donorId?: string;
  readonly donorEmail?: string;
  readonly amount: number;
};

export class DonationPaidEvent extends DomainEvent<DonationPaidSnapshot> {
  constructor(
    public readonly donationId: string,
    donorId: string | undefined,
    donorEmail: string | undefined,
    amount: number,
  ) {
    super(donationId, { donationId, donorId, donorEmail, amount });
  }
}
