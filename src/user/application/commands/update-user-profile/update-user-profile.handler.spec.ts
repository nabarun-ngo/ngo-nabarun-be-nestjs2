import { EventBus } from '@nestjs/cqrs';
import { UpdateUserProfileHandler } from './update-user-profile.handler';
import { UpdateUserProfileCommand } from './update-user-profile.command';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/aggregates/user/user.aggregate';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { UserNotFoundError } from '../../../domain/errors/user.errors';

function makeUser(): User {
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
    idpSub: 'auth0|abc',
  });
}

describe('UpdateUserProfileHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findById' | 'update'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publishAll'>>;
  let handler: UpdateUserProfileHandler;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(makeUser()),
      update: jest.fn().mockResolvedValue(undefined),
    };
    eventBus = { publishAll: jest.fn() };
    handler = new UpdateUserProfileHandler(
      repo as unknown as IUserRepository,
      eventBus as unknown as EventBus,
    );
  });

  it('updates the user profile and persists', async () => {
    const cmd = new UpdateUserProfileCommand({
      userId: 'user-id-1',
      detail: { firstName: 'Jane', gender: 'FEMALE' },
      requestorId: 'user-id-1',
    });

    const result = await handler.execute(cmd);

    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(result.firstName).toBe('Jane');
    expect(result.gender).toBe('FEMALE');
  });

  it('publishes domain events after persist', async () => {
    const cmd = new UpdateUserProfileCommand({
      userId: 'user-id-1',
      detail: { firstName: 'Jane' },
      requestorId: 'user-id-1',
    });
    await handler.execute(cmd);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('sets updatedById before persisting', async () => {
    const cmd = new UpdateUserProfileCommand({
      userId: 'user-id-1',
      detail: { firstName: 'Jane' },
      requestorId: 'requester-uuid',
    });
    await handler.execute(cmd);
    const persistedUser: User = repo.update.mock.calls[0][1];
    expect(persistedUser.updatedById).toBe('requester-uuid');
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    const cmd = new UpdateUserProfileCommand({
      userId: 'ghost-id',
      detail: { firstName: 'Ghost' },
      requestorId: 'r-id',
    });
    await expect(handler.execute(cmd)).rejects.toThrow(UserNotFoundError);
  });
});
