export class RemindPendingDonationsJob {
  constructor(public readonly payload: { userId?: string } = {}) {}
}

