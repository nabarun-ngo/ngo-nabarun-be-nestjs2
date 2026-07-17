export class InitiatePasswordChangeCommand {
  constructor(
    public readonly params: {
      /** Profile id of the user requesting the password change. */
      userId: string;
      /** App profile UUID of the requestor (for audit). */
      requestorId: string;
    },
  ) {}
}
