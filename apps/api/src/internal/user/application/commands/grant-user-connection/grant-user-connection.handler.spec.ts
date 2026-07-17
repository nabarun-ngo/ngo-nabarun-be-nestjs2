import { GrantUserConnectionHandler } from './grant-user-connection.handler';
import { GrantUserConnectionCommand } from './grant-user-connection.command';
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
    isProfileComplete: true,
    isPublic: true,
    socialMediaLinks: [],
    deletedAt: null,
    version: 0,
    idpSub,
  });
}

describe('GrantUserConnectionHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findById'>>;
  let identityProvider: jest.Mocked<Pick<IIdentityProvider, 'grantConnection'>>;
  let handler: GrantUserConnectionHandler;

  beforeEach(() => {
    repo = { findById: jest.fn().mockResolvedValue(makeUser('auth0|abc')) };
    identityProvider = {
      grantConnection: jest.fn().mockResolvedValue({ status: 'linked' }),
    };
    handler = new GrantUserConnectionHandler(
      repo as unknown as IUserRepository,
      identityProvider as unknown as IIdentityProvider,
    );
  });

  it('calls grantConnection with the user idpSub and connectionKey', async () => {
    const cmd = new GrantUserConnectionCommand({
      userId: 'user-id-1',
      connectionKey: 'passwordless',
      adminId: 'admin-id',
    });

    const result = await handler.execute(cmd);

    expect(identityProvider.grantConnection).toHaveBeenCalledWith('auth0|abc', 'passwordless', expect.any(Object));
    expect(result).toEqual({ status: 'linked' });
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    const cmd = new GrantUserConnectionCommand({ userId: 'ghost', connectionKey: 'passwordless', adminId: 'a' });
    await expect(handler.execute(cmd)).rejects.toThrow(UserNotFoundError);
  });

  it('throws IdentityNotLinkedError when idpSub is absent', async () => {
    repo.findById.mockResolvedValue(makeUser(undefined));
    const cmd = new GrantUserConnectionCommand({ userId: 'user-id-1', connectionKey: 'passwordless', adminId: 'a' });
    await expect(handler.execute(cmd)).rejects.toThrow(IdentityNotLinkedError);
  });
});
