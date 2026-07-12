import { GetUserByIdHandler } from './get-user-by-id.handler';
import { GetUserByIdQuery } from './get-user-by-id.query';
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
    isProfileComplete: true,
    isPublic: true,
    socialMediaLinks: [],
    deletedAt: null,
    version: 0,
    idpSub: 'auth0|abc',
  });
}

describe('GetUserByIdHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findById'>>;
  let handler: GetUserByIdHandler;

  beforeEach(() => {
    repo = { findById: jest.fn().mockResolvedValue(makeUser()) };
    handler = new GetUserByIdHandler(repo as unknown as IUserRepository);
  });

  it('returns a UserResponseDto when the user exists', async () => {
    const result = await handler.execute(new GetUserByIdQuery('user-id-1'));

    expect(result.id).toBe('user-id-1');
    expect(result.email).toBe('john@example.com');
    expect(result.fullName).toBe('John Doe');
  });

  it('queries the repository with the given userId', async () => {
    await handler.execute(new GetUserByIdQuery('user-id-1'));
    expect(repo.findById).toHaveBeenCalledWith('user-id-1');
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(handler.execute(new GetUserByIdQuery('ghost'))).rejects.toThrow(UserNotFoundError);
  });
});
