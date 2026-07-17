export class ClaimTaskCommand {
  constructor(
    public readonly params: {
      taskId: string;
      userId: string;
      userPermissions: string[];
    },
  ) {}
}
