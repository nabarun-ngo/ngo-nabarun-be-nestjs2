export class DeleteUserCommand {
  constructor(
    public readonly params: {
      userId: string;
      /** App profile UUID of the admin performing the delete. */
      adminId: string;
    },
  ) {}
}
