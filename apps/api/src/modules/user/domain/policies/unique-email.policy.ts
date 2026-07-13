import { DuplicateEmailError } from '../errors/user.errors';
import { UserStatus } from '../enums/user-status.enum';

export interface UserEmailConflictCheck {
  status: string;
  deletedAt: Date | null | undefined;
}

/** Pure guard — call with the result of findByEmail before creating a new user. */
export class UniqueEmailPolicy {
  static assertNoDuplicate(email: string, existing: UserEmailConflictCheck | null): void {
    if (!existing) return;
    const isDeleted =
      existing.status === UserStatus.DELETED || !!existing.deletedAt;
    if (!isDeleted) {
      throw new DuplicateEmailError(email);
    }
  }
}
