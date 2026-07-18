import { UserStatus } from '../enums/user-status.enum';
import { InvalidStatusTransitionError } from '../errors/user.errors';

/** Defines which status transitions are allowed and by whom. */
export class UserStatusTransitionPolicy {
  /** Allowed transitions for normal admin operations (not restoration). */
  private static readonly ALLOWED: Partial<Record<UserStatus, UserStatus[]>> = {
    [UserStatus.DRAFT]: [UserStatus.ACTIVE, UserStatus.BLOCKED],
    [UserStatus.ACTIVE]: [UserStatus.BLOCKED, UserStatus.DELETED],
    [UserStatus.BLOCKED]: [UserStatus.ACTIVE, UserStatus.DELETED],
    // DELETED → ACTIVE only via restoreFromDeletion() — not via changeStatus
  };

  /** Throws if the transition is not allowed. */
  static assertTransition(from: UserStatus, to: UserStatus): void {
    const allowed = this.ALLOWED[from] ?? [];
    if (!allowed.includes(to)) {
      throw new InvalidStatusTransitionError(from, to);
    }
  }

  /** A BLOCKED user cannot self-update their profile. */
  static assertCanSelfUpdate(status: UserStatus): void {
    if (status === UserStatus.BLOCKED) {
      throw new InvalidStatusTransitionError(status, status);
    }
  }
}
