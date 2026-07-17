export class DelegateTaskCommand {
  constructor(
    public readonly params: {
      taskId: string;
      fromUserId: string;
      toUserId: string;
      userPermissions: string[];
    },
  ) {}
}
