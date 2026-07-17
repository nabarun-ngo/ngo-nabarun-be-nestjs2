export class CompleteUserTaskCommand {
  constructor(
    public readonly params: {
      taskId: string;
      userId: string;
      userPermissions: string[];
      formValues?: Record<string, unknown>;
      idempotencyKey?: string;
      correlationId?: string;
    },
  ) {}
}
