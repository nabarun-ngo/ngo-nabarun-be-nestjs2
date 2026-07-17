import { UserStatusTransitionPolicy } from './user-status-transition.policy';
import { UserStatus } from '../enums/user-status.enum';
import { InvalidStatusTransitionError } from '../errors/user.errors';

describe('UserStatusTransitionPolicy', () => {
  describe('assertTransition()', () => {
    const allowed: [UserStatus, UserStatus][] = [
      [UserStatus.DRAFT,    UserStatus.ACTIVE],
      [UserStatus.DRAFT,    UserStatus.BLOCKED],
      [UserStatus.ACTIVE,   UserStatus.BLOCKED],
      [UserStatus.ACTIVE,   UserStatus.DELETED],
      [UserStatus.BLOCKED,  UserStatus.ACTIVE],
      [UserStatus.BLOCKED,  UserStatus.DELETED],
    ];

    it.each(allowed)('allows %s → %s', (from, to) => {
      expect(() => UserStatusTransitionPolicy.assertTransition(from, to)).not.toThrow();
    });

    const forbidden: [UserStatus, UserStatus][] = [
      [UserStatus.DELETED,  UserStatus.ACTIVE],
      [UserStatus.DELETED,  UserStatus.BLOCKED],
      [UserStatus.DRAFT,    UserStatus.DELETED],
      [UserStatus.ACTIVE,   UserStatus.DRAFT],
      [UserStatus.BLOCKED,  UserStatus.DRAFT],
    ];

    it.each(forbidden)('rejects %s → %s', (from, to) => {
      expect(() => UserStatusTransitionPolicy.assertTransition(from, to)).toThrow(
        InvalidStatusTransitionError,
      );
    });
  });

  describe('assertCanSelfUpdate()', () => {
    it('allows self-update when status is ACTIVE', () => {
      expect(() =>
        UserStatusTransitionPolicy.assertCanSelfUpdate(UserStatus.ACTIVE),
      ).not.toThrow();
    });

    it('allows self-update when status is DRAFT', () => {
      expect(() =>
        UserStatusTransitionPolicy.assertCanSelfUpdate(UserStatus.DRAFT),
      ).not.toThrow();
    });

    it('throws when status is BLOCKED', () => {
      expect(() =>
        UserStatusTransitionPolicy.assertCanSelfUpdate(UserStatus.BLOCKED),
      ).toThrow(InvalidStatusTransitionError);
    });
  });
});
