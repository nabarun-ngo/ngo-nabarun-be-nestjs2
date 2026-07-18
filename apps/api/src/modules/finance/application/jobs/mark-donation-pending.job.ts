export class MarkDonationPendingJob {
  constructor(public readonly payload: { donationId?: string } = {}) {}
}

