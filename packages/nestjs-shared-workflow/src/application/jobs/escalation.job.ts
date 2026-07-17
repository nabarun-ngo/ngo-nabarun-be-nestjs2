export class EscalationJob {
  constructor(
    public readonly payload: {
      instanceId: string;
      elementId: string;
      correlationId?: string;
    },
  ) {}
}
