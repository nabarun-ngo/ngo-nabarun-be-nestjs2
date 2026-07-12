import { UserUpdateProps } from '../../../domain/aggregates/user/user.aggregate';

export class UpdateUserProfileCommand {
  constructor(
    public readonly params: {
      userId: string;
      detail: UserUpdateProps;
      /** App profile UUID of the authenticated user performing this update. */
      requestorId: string;
    },
  ) {}
}
