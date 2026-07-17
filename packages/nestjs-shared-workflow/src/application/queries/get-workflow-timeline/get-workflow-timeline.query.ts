export class GetWorkflowTimelineQuery {
  constructor(
    public readonly instanceId: string,
    public readonly options?: { fromSequence?: number; limit?: number },
  ) {}
}
