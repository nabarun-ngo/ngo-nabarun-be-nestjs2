import { ListUsersHandler } from './list-users.handler';
import { ListUsersQuery } from './list-users.query';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/aggregates/user/user.aggregate';
import { UserStatus } from '../../../domain/enums/user-status.enum';

function makeUser(id: string): User {
  return User.rehydrate({
    id,
    email: `${id}@example.com`,
    status: UserStatus.ACTIVE,
    firstName: 'User',
    lastName: id,
    isProfileComplete: false,
    isPublic: true,
    socialMediaLinks: [],
    deletedAt: null,
    version: 0,
  });
}

function makePagedResult(users: User[], total = users.length) {
  return {
    content: users,
    totalSize: total,
    pageIndex: 0,
    pageSize: 20,
  };
}

describe('ListUsersHandler', () => {
  let repo: jest.Mocked<Pick<IUserRepository, 'findPaged'>>;
  let handler: ListUsersHandler;

  beforeEach(() => {
    repo = {
      findPaged: jest.fn().mockResolvedValue(makePagedResult([makeUser('u1'), makeUser('u2')])),
    };
    handler = new ListUsersHandler(repo as unknown as IUserRepository);
  });

  it('returns a paginated list of users', async () => {
    const result = await handler.execute(new ListUsersQuery());

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.pageIndex).toBe(0);
    expect(result.pageSize).toBe(20);
  });

  it('maps each user to a UserResponseDto', async () => {
    const result = await handler.execute(new ListUsersQuery());

    expect(result.items[0].id).toBe('u1');
    expect(result.items[1].id).toBe('u2');
  });

  it('passes the filter to the repository', async () => {
    const filter = { email: 'test@example.com', status: UserStatus.ACTIVE };
    await handler.execute(new ListUsersQuery(filter, 0, 10));

    const passedFilter = repo.findPaged.mock.calls[0]?.[0];
    expect(passedFilter?.props).toMatchObject(filter);
  });

  it('applies pagination parameters', async () => {
    await handler.execute(new ListUsersQuery(undefined, 2, 5));

    const passedFilter = repo.findPaged.mock.calls[0]?.[0];
    expect(passedFilter?.pageIndex).toBe(2);
    expect(passedFilter?.pageSize).toBe(5);
  });

  it('defaults to pageIndex=0, pageSize=20 when not specified', async () => {
    await handler.execute(new ListUsersQuery());

    const passedFilter = repo.findPaged.mock.calls[0]?.[0];
    expect(passedFilter?.pageIndex).toBe(0);
    expect(passedFilter?.pageSize).toBe(20);
  });

  it('returns an empty list when no users match', async () => {
    repo.findPaged.mockResolvedValue(makePagedResult([], 0));
    const result = await handler.execute(new ListUsersQuery());

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
