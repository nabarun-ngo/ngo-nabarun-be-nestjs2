import { EventBus } from '@nestjs/cqrs';
import { UpdateUserAdminHandler } from './update-user-admin.handler';
import { UpdateUserAdminCommand } from './update-user-admin.command';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/aggregates/user/user.aggregate';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { UserNotFoundError, InvalidStatusTransitionError } from '../../../domain/errors/user.errors';

function makeUser(status = UserStatus.ACTIVE): User {
  return User.rehydrate({
    id: 'user-id-1',
    email: 'john@example.com',
    status,
    firstName: 'John',
    lastName: 'Doe',
    isProfileComplete: false,
    isPublic: true,
    socialMediaLinks: [],
    deletedAt: null,
    version: 0,
    idpSub: 'auth0|abc',
  });
}

describe('UpdateUserAdminHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findById' | 'update'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publishAll'>>;
  let handler: UpdateUserAdminHandler;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(makeUser()),
      update: jest.fn().mockResolvedValue(undefined),
    };
    eventBus = { publishAll: jest.fn() };
    handler = new UpdateUserAdminHandler(
      repo as unknown as IUserRepository,
      eventBus as unknown as EventBus,
    );
  });

  it('blocks an active user and persists', async () => {
    const cmd = new UpdateUserAdminCommand({
      userId: 'user-id-1',
      detail: { status: UserStatus.BLOCKED },
      adminId: 'admin-uuid',
    });

    const result = await handler.execute(cmd);

    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(UserStatus.BLOCKED);
  });

  it('publishes domain events after persist', async () => {
    const cmd = new UpdateUserAdminCommand({
      userId: 'user-id-1',
      detail: { status: UserStatus.BLOCKED },
      adminId: 'admin-uuid',
    });
    await handler.execute(cmd);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('sets updatedById before persisting', async () => {
    const cmd = new UpdateUserAdminCommand({
      userId: 'user-id-1',
      detail: { status: UserStatus.BLOCKED },
      adminId: 'admin-uuid',
    });
    await handler.execute(cmd);
    const persistedUser: User = repo.update.mock.calls[0][1];
    expect(persistedUser.updatedById).toBe('admin-uuid');
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    const cmd = new UpdateUserAdminCommand({
      userId: 'ghost',
      detail: {},
      adminId: 'admin-uuid',
    });
    await expect(handler.execute(cmd)).rejects.toThrow(UserNotFoundError);
  });

  it('throws InvalidStatusTransitionError on illegal transition', async () => {
    repo.findById.mockResolvedValue(makeUser(UserStatus.DRAFT));
    const cmd = new UpdateUserAdminCommand({
      userId: 'user-id-1',
      detail: { status: UserStatus.DELETED },
      adminId: 'admin-uuid',
    });
    await expect(handler.execute(cmd)).rejects.toThrow(InvalidStatusTransitionError);
  });
});
