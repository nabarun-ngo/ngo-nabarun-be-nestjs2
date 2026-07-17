export class StartWorkflowCronJob {
  constructor(
    public readonly payload: {
      definitionId: string;
      definitionVersion?: number;
      name: string;
      description?: string;
      context?: Record<string, unknown>;
      initiatedById?: string | null;
      initiatedForId?: string | null;
    },
  ) {}
}
