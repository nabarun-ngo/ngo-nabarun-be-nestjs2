export class TriggerMonthlyDonationJob {
  constructor(public readonly payload: { userId?: string } = {}) {}
}

