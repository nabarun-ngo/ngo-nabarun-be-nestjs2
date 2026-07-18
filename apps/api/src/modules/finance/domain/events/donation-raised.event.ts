import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type DonationRaisedSnapshot = {
  readonly donationId: string;
  readonly donorId?: string;
  readonly donorEmail?: string;
  readonly amount: number;
  readonly type: string;
};

export class DonationRaisedEvent extends DomainEvent<DonationRaisedSnapshot> {
  constructor(
    public readonly donationId: string,
    donorId: string | undefined,
    donorEmail: string | undefined,
    amount: number,
    type: string,
  ) {
    super(donationId, { donationId, donorId, donorEmail, amount, type });
  }
}
