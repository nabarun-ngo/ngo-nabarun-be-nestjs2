import { UniqueEmailPolicy } from './unique-email.policy';
import { UserStatus } from '../enums/user-status.enum';
import { DuplicateEmailError } from '../errors/user.errors';

describe('UniqueEmailPolicy', () => {
  it('passes when no existing user is found', () => {
    expect(() =>
      UniqueEmailPolicy.assertNoDuplicate('a@b.com', null),
    ).not.toThrow();
  });

  it('passes when the existing user is soft-deleted (status=DELETED)', () => {
    expect(() =>
      UniqueEmailPolicy.assertNoDuplicate('a@b.com', {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it('passes when the existing user has a deletedAt date even if status is not DELETED', () => {
    expect(() =>
      UniqueEmailPolicy.assertNoDuplicate('a@b.com', {
        status: UserStatus.ACTIVE,
        deletedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it('throws DuplicateEmailError when an active user with that email exists', () => {
    expect(() =>
      UniqueEmailPolicy.assertNoDuplicate('a@b.com', {
        status: UserStatus.ACTIVE,
        deletedAt: null,
      }),
    ).toThrow(DuplicateEmailError);
  });

  it('throws DuplicateEmailError when a BLOCKED user with that email exists', () => {
    expect(() =>
      UniqueEmailPolicy.assertNoDuplicate('a@b.com', {
        status: UserStatus.BLOCKED,
        deletedAt: null,
      }),
    ).toThrow(DuplicateEmailError);
  });

  it('throws DuplicateEmailError when a DRAFT user with that email exists', () => {
    expect(() =>
      UniqueEmailPolicy.assertNoDuplicate('a@b.com', {
        status: UserStatus.DRAFT,
        deletedAt: null,
      }),
    ).toThrow(DuplicateEmailError);
  });
});
