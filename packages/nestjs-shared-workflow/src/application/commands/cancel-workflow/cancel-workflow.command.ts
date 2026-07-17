export class CancelWorkflowCommand {
  constructor(
    public readonly params: {
      instanceId: string;
      actorId?: string | null;
      remarks?: string;
    },
  ) {}
}
