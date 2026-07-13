import { UserAdminUpdateProps } from '../../../domain/aggregates/user/user.aggregate';

export class UpdateUserAdminCommand {
  constructor(
    public readonly params: {
      userId: string;
      detail: UserAdminUpdateProps;
      /** App profile UUID of the admin performing this update. */
      adminId: string;
    },
  ) {}
}
