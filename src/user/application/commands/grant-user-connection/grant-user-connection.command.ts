export class GrantUserConnectionCommand {
  constructor(
    public readonly params: {
      userId: string;
      connectionKey: string;
      /** App profile UUID of the admin performing this action. */
      adminId: string;
    },
  ) {}
}
