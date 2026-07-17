import { EventBus } from '@nestjs/cqrs';
import { DeleteUserHandler } from './delete-user.handler';
import { DeleteUserCommand } from './delete-user.command';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';
import { User } from '../../../domain/aggregates/user/user.aggregate';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { UserNotFoundError } from '../../../domain/errors/user.errors';
import { UserDeletedEvent } from '../../../domain/events/user-deleted.event';

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

describe('DeleteUserHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findById' | 'update'>>;
  let identityProvider: jest.Mocked<Pick<IIdentityProvider, 'deleteUser'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publishAll'>>;
  let handler: DeleteUserHandler;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(makeUser('auth0|abc')),
      update: jest.fn().mockResolvedValue(undefined),
    };
    identityProvider = {
      deleteUser: jest.fn().mockResolvedValue(undefined),
    };
    eventBus = { publishAll: jest.fn() };
    handler = new DeleteUserHandler(
      repo as unknown as IUserRepository,
      identityProvider as unknown as IIdentityProvider,
      eventBus as unknown as EventBus,
    );
  });

  it('soft-deletes the user and persists', async () => {
    const cmd = new DeleteUserCommand({ userId: 'user-id-1', adminId: 'admin-id' });
    await handler.execute(cmd);

    expect(repo.update).toHaveBeenCalledTimes(1);
    const persisted: User = repo.update.mock.calls[0][1];
    expect(persisted.status).toBe(UserStatus.DELETED);
    expect(persisted.deletedAt).toBeInstanceOf(Date);
  });

  it('calls identityProvider.deleteUser when idpSub is present', async () => {
    const cmd = new DeleteUserCommand({ userId: 'user-id-1', adminId: 'admin-id' });
    await handler.execute(cmd);

    expect(identityProvider.deleteUser).toHaveBeenCalledWith('auth0|abc');
  });

  it('skips identityProvider.deleteUser when idpSub is absent', async () => {
    repo.findById.mockResolvedValue(makeUser(undefined));
    const cmd = new DeleteUserCommand({ userId: 'user-id-1', adminId: 'admin-id' });
    await handler.execute(cmd);

    expect(identityProvider.deleteUser).not.toHaveBeenCalled();
  });

  it('publishes UserDeletedEvent after persist', async () => {
    const cmd = new DeleteUserCommand({ userId: 'user-id-1', adminId: 'admin-id' });
    await handler.execute(cmd);

    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    const [events] = eventBus.publishAll.mock.calls[0];
    expect(events.some((e) => e instanceof UserDeletedEvent)).toBe(true);
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    const cmd = new DeleteUserCommand({ userId: 'ghost', adminId: 'admin-id' });
    await expect(handler.execute(cmd)).rejects.toThrow(UserNotFoundError);
  });
});
