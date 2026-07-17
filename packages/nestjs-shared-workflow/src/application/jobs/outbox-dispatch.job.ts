export class OutboxDispatchJob {
  constructor(
    public readonly payload: {
      batchSize?: number;
    } = {},
  ) {}
}
