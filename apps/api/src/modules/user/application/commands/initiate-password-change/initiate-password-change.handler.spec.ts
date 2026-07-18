import { InitiatePasswordChangeHandler } from './initiate-password-change.handler';
import { InitiatePasswordChangeCommand } from './initiate-password-change.command';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';
import { User } from '../../../domain/aggregates/user/user.aggregate';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { UserNotFoundError, IdentityNotLinkedError } from '../../../domain/errors/user.errors';

function makeUser(idpSub?: string): User {
  return User.rehydrate({
    id: 'user-id-1',
    email: 'john@example.com',
    status: UserStatus.ACTIVE,
    firstName: 'John',
    lastName: 'Doe',
    isProfileComplete: false,
    isPublic: true,
    socialMediaLinks: [],
    deletedAt: null,
    version: 0,
    idpSub,
  });
}

describe('InitiatePasswordChangeHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findById'>>;
  let identityProvider: jest.Mocked<Pick<IIdentityProvider, 'sendPasswordReset'>>;
  let handler: InitiatePasswordChangeHandler;

  beforeEach(() => {
    repo = { findById: jest.fn().mockResolvedValue(makeUser('auth0|abc')) };
    identityProvider = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) };
    handler = new InitiatePasswordChangeHandler(
      repo as unknown as IUserRepository,
      identityProvider as unknown as IIdentityProvider,
    );
  });

  it('calls sendPasswordReset with the user idpSub', async () => {
    const cmd = new InitiatePasswordChangeCommand({ userId: 'user-id-1', requestorId: 'user-id-1' });
    await handler.execute(cmd);
    expect(identityProvider.sendPasswordReset).toHaveBeenCalledWith('auth0|abc');
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    const cmd = new InitiatePasswordChangeCommand({ userId: 'ghost', requestorId: 'r-id' });
    await expect(handler.execute(cmd)).rejects.toThrow(UserNotFoundError);
  });

  it('throws IdentityNotLinkedError when idpSub is absent', async () => {
    repo.findById.mockResolvedValue(makeUser(undefined));
    const cmd = new InitiatePasswordChangeCommand({ userId: 'user-id-1', requestorId: 'r-id' });
    await expect(handler.execute(cmd)).rejects.toThrow(IdentityNotLinkedError);
  });
});
