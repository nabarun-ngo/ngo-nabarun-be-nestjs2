export class WorkflowTimerJob {
  constructor(
    public readonly payload: {
      instanceId: string;
      elementId: string;
      correlationId?: string;
    },
  ) {}
}
