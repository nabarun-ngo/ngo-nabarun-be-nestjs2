import { EventBus } from '@nestjs/cqrs';
import { CreateUserHandler } from './create-user.handler';
import { CreateUserCommand } from './create-user.command';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IIdentityProvider } from '../../../domain/ports/identity-provider.port';
import { User, UserRehydrateProps } from '../../../domain/aggregates/user/user.aggregate';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { DuplicateEmailError } from '../../../domain/errors/user.errors';

function makeDeletedUser(overrides: Partial<UserRehydrateProps> = {}): User {
  return User.rehydrate({
    id: 'old-user-id',
    email: 'test@example.com',
    status: UserStatus.DELETED,
    firstName: 'Old',
    lastName: 'User',
    isProfileComplete: false,
    isPublic: true,
    socialMediaLinks: [],
    deletedAt: new Date('2024-01-01'),
    version: 3,
    ...overrides,
  });
}

const baseCmd = (): CreateUserCommand =>
  new CreateUserCommand({
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdById: 'admin-id',
  });

describe('CreateUserHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findByEmail' | 'create' | 'update'>>;
  let identityProvider: jest.Mocked<IIdentityProvider>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publishAll'>>;
  let handler: CreateUserHandler;

  beforeEach(() => {
    repo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    identityProvider = {
      createUser: jest.fn().mockResolvedValue({ externalSub: 'auth0|new-sub' }),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      sendPasswordReset: jest.fn(),
      grantConnection: jest.fn(),
      revokeConnection: jest.fn(),
      listConnections: jest.fn(),
    };
    eventBus = { publishAll: jest.fn() };
    handler = new CreateUserHandler(
      repo as unknown as IUserRepository,
      identityProvider,
      eventBus as unknown as EventBus,
    );
  });

  it('creates and persists a new user', async () => {
    const result = await handler.execute(baseCmd());

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(result.email).toBe('test@example.com');
  });

  it('calls identityProvider.createUser with the new user', async () => {
    await handler.execute(baseCmd());

    expect(identityProvider.createUser).toHaveBeenCalledTimes(1);
    const [userArg, optsArg] = identityProvider.createUser.mock.calls[0];
    expect(userArg.email).toBe('test@example.com');
    expect(optsArg.resetPassword).toBe(true); // no adminPassword → system password
  });

  it('publishes domain events after persist', async () => {
    await handler.execute(baseCmd());
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('sets the idpSub returned from the identity provider on the user', async () => {
    const result = await handler.execute(baseCmd());
    expect(result.idpSub).toBe('auth0|new-sub');
  });

  it('sets createdById and updatedById audit fields', async () => {
    await handler.execute(baseCmd());
    const persistedUser: User = repo.create.mock.calls[0][0];
    expect(persistedUser.createdById).toBe('admin-id');
    expect(persistedUser.updatedById).toBe('admin-id');
  });

  it('does not generate a system password when adminPassword is supplied', async () => {
    const cmd = new CreateUserCommand({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdById: 'admin-id',
      adminPassword: 'S3cur3P@ss!',
    });
    await handler.execute(cmd);
    const [, opts] = identityProvider.createUser.mock.calls[0];
    expect(opts.resetPassword).toBe(false);
    expect(opts.adminPassword).toBe('S3cur3P@ss!');
  });

  it('reuses a soft-deleted user record on email collision', async () => {
    const existingDeleted = makeDeletedUser();
    repo.findByEmail.mockResolvedValue(existingDeleted);

    await handler.execute(baseCmd());

    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws DuplicateEmailError when an active user with that email exists', async () => {
    const activeUser = User.rehydrate({
      id: 'u-active',
      email: 'test@example.com',
      status: UserStatus.ACTIVE,
      firstName: 'A',
      lastName: 'B',
      isProfileComplete: false,
      isPublic: true,
      socialMediaLinks: [],
      deletedAt: null,
      version: 0,
    });
    repo.findByEmail.mockResolvedValue(activeUser);

    await expect(handler.execute(baseCmd())).rejects.toThrow(DuplicateEmailError);
  });
});
