export class DetectStuckWorkflowsJob {
  constructor(
    public readonly payload: {
      olderThanMinutes?: number;
    } = {},
  ) {}
}
