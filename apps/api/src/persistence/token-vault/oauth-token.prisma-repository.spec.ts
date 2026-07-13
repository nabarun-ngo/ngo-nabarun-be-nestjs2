import { OAuthTokenPrismaRepository } from './oauth-token.prisma-repository';
import { OAuthToken } from '@ce/nestjs-shared-token-vault/domain/aggregates/oauth-token/oauth-token.aggregate';
import { EncryptedToken } from '@ce/nestjs-shared-token-vault/domain/value-objects/encrypted-token.vo';
import { TokenScope } from '@ce/nestjs-shared-token-vault/domain/value-objects/token-scope.vo';
import { InvalidEncryptedTokenError } from '@ce/nestjs-shared-token-vault/domain/errors/token-vault.errors';

const SECRET = 'super-secret-key-that-is-at-least-32chars!!';
const FUTURE = new Date('2099-01-01T00:00:00.000Z');

async function makeValidEncryptedToken(plaintext = 'access-value'): Promise<EncryptedToken> {
  return EncryptedToken.fromPlaintext(plaintext, SECRET);
}

async function buildToken(overrides: Partial<{
  accessToken: EncryptedToken;
  refreshToken: EncryptedToken | null;
  scope: TokenScope | null;
  ownerSub: string;
}> = {}): Promise<OAuthToken> {
  const access = overrides.accessToken ?? await makeValidEncryptedToken('access-token');
  const refreshToken = 'refreshToken' in overrides
    ? overrides.refreshToken
    : await makeValidEncryptedToken('refresh-token');
  const token = OAuthToken.create({
    accountId: 'account-uuid',
    clientId: 'client-id',
    provider: 'google',
    email: 'user@example.com',
    ownerSub: overrides.ownerSub ?? 'sub-123',
    accessToken: access,
    refreshToken: refreshToken ?? undefined,
    expiresAt: FUTURE,
    scope: 'scope' in overrides ? (overrides.scope ?? undefined) : TokenScope.of('openid email'),
    tokenType: 'Bearer',
  });
  return token;
}

// We test the protected mapping hooks by subclassing (white-box test)
class TestableOAuthTokenRepo extends OAuthTokenPrismaRepository {
  // Expose protected methods for unit testing
  publicToDomain(row: any): OAuthToken {
    return this['toDomain'](row);
  }
  publicToCreateInput(entity: OAuthToken): any {
    return this['toCreateInput'](entity);
  }
  publicToUpdateInput(id: string, entity: OAuthToken): any {
    return this['toUpdateInput'](id, entity);
  }
  publicToUniqueWhere(id: string): any {
    return this['toUniqueWhere'](id);
  }
  publicToFilterWhere(filter?: any): any {
    return this['toFilterWhere'](filter);
  }
  publicSupportsSoftDelete(): boolean {
    return this['supportsSoftDelete']();
  }
  publicDefaultOrderBy(): any {
    return this['defaultOrderBy']();
  }
}

function makeRepo(): TestableOAuthTokenRepo {
  const database = { getClient: jest.fn() };
  return new TestableOAuthTokenRepo(database as any);
}

const baseRow = {
  id: 'token-uuid',
  accountId: 'account-uuid',
  clientId: 'client-id',
  provider: 'google',
  email: 'user@example.com',
  ownerSub: 'sub-123',
  accessToken: '', // Will be set to a valid encrypted value
  refreshToken: null as string | null,
  tokenType: 'Bearer',
  expiresAt: FUTURE,
  scope: 'email openid',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  account: null,
};

describe('OAuthTokenPrismaRepository — mapping hooks', () => {
  let encryptedAccessRaw: string;
  let encryptedRefreshRaw: string;

  beforeAll(async () => {
    const accessEnc = await makeValidEncryptedToken('access-plaintext');
    const refreshEnc = await makeValidEncryptedToken('refresh-plaintext');
    encryptedAccessRaw = accessEnc.raw;
    encryptedRefreshRaw = refreshEnc.raw;
  });

  describe('toDomain()', () => {
    it('reconstructs an OAuthToken from a Prisma row', () => {
      const repo = makeRepo();
      const row = { ...baseRow, accessToken: encryptedAccessRaw };

      const token = repo.publicToDomain(row);

      expect(token).toBeInstanceOf(OAuthToken);
      expect(token.id).toBe('token-uuid');
      expect(token.accountId).toBe('account-uuid');
      expect(token.clientId).toBe('client-id');
      expect(token.provider).toBe('google');
      expect(token.email).toBe('user@example.com');
      expect(token.ownerSub).toBe('sub-123');
      expect(token.tokenType).toBe('Bearer');
      expect(token.expiresAt).toEqual(FUTURE);
    });

    it('wraps accessToken as EncryptedToken', () => {
      const repo = makeRepo();
      const row = { ...baseRow, accessToken: encryptedAccessRaw };
      const token = repo.publicToDomain(row);
      expect(token.accessToken).toBeInstanceOf(EncryptedToken);
      expect(token.accessToken.raw).toBe(encryptedAccessRaw);
    });

    it('wraps refreshToken as EncryptedToken when present', () => {
      const repo = makeRepo();
      const row = { ...baseRow, accessToken: encryptedAccessRaw, refreshToken: encryptedRefreshRaw };
      const token = repo.publicToDomain(row);
      expect(token.refreshToken).toBeInstanceOf(EncryptedToken);
      expect(token.refreshToken!.raw).toBe(encryptedRefreshRaw);
    });

    it('sets refreshToken to null when absent', () => {
      const repo = makeRepo();
      const row = { ...baseRow, accessToken: encryptedAccessRaw, refreshToken: null };
      const token = repo.publicToDomain(row);
      expect(token.refreshToken).toBeNull();
    });

    it('reconstructs TokenScope from storage scope string', () => {
      const repo = makeRepo();
      const row = { ...baseRow, accessToken: encryptedAccessRaw, scope: 'openid email' };
      const token = repo.publicToDomain(row);
      expect(token.scope).not.toBeNull();
      expect(token.scope!.contains('openid')).toBe(true);
      expect(token.scope!.contains('email')).toBe(true);
    });

    it('sets scope to null when scope column is null', () => {
      const repo = makeRepo();
      const row = { ...baseRow, accessToken: encryptedAccessRaw, scope: null };
      const token = repo.publicToDomain(row);
      expect(token.scope).toBeNull();
    });

    it('populates account snapshot when relation is present', () => {
      const repo = makeRepo();
      const row = {
        ...baseRow,
        accessToken: encryptedAccessRaw,
        account: {
          id: 'acc-uuid',
          email: 'user@example.com',
          externalId: 'sub-123',
          name: 'Test User',
          givenName: 'Test',
          familyName: 'User',
          pictureUrl: null,
          locale: null,
        },
      };
      const token = repo.publicToDomain(row);
      expect(token.account).toBeDefined();
      expect(token.account!.id).toBe('acc-uuid');
      expect(token.account!.email).toBe('user@example.com');
    });

    it('sets account to undefined when relation is null', () => {
      const repo = makeRepo();
      const row = { ...baseRow, accessToken: encryptedAccessRaw, account: null };
      const token = repo.publicToDomain(row);
      expect(token.account).toBeUndefined();
    });
  });

  describe('toCreateInput()', () => {
    it('maps domain token to a Prisma create payload', async () => {
      const repo = makeRepo();
      const token = await buildToken();
      const input = repo.publicToCreateInput(token);

      expect(input.id).toBe(token.id);
      expect(input.accountId).toBe('account-uuid');
      expect(input.clientId).toBe('client-id');
      expect(input.provider).toBe('google');
      expect(input.email).toBe('user@example.com');
      expect(input.ownerSub).toBe('sub-123');
      expect(input.tokenType).toBe('Bearer');
    });

    it('stores the raw encrypted accessToken string (never plaintext)', async () => {
      const repo = makeRepo();
      const token = await buildToken();
      const input = repo.publicToCreateInput(token);
      // Must match the v2:... format, not the original plaintext
      expect(input.accessToken).toMatch(/^v2:/);
    });

    it('stores the raw encrypted refreshToken when present', async () => {
      const repo = makeRepo();
      const token = await buildToken();
      const input = repo.publicToCreateInput(token);
      expect(input.refreshToken).toMatch(/^v2:/);
    });

    it('sets refreshToken to null when absent', async () => {
      const repo = makeRepo();
      const token = await buildToken({ refreshToken: null });
      const input = repo.publicToCreateInput(token);
      expect(input.refreshToken).toBeNull();
    });

    it('stores scope as a space-separated string', async () => {
      const repo = makeRepo();
      const token = await buildToken({ scope: TokenScope.of('openid email') });
      const input = repo.publicToCreateInput(token);
      expect(typeof input.scope).toBe('string');
      expect(input.scope).toContain('email');
      expect(input.scope).toContain('openid');
    });

    it('throws InvalidEncryptedTokenError if accessToken is not properly encrypted', async () => {
      const repo = makeRepo();
      // Build a token with a plaintext-looking accessToken by forcing an invalid raw value
      const fakePlaintext = { raw: 'not-encrypted-value', decrypt: jest.fn() } as unknown as EncryptedToken;
      const token = await buildToken({ accessToken: fakePlaintext });
      expect(() => repo.publicToCreateInput(token)).toThrow(InvalidEncryptedTokenError);
    });
  });

  describe('toUpdateInput()', () => {
    it('maps updated fields (excludes id)', async () => {
      const repo = makeRepo();
      const token = await buildToken();
      const input = repo.publicToUpdateInput('token-uuid', token);

      expect((input as any).id).toBeUndefined();
      expect(input.accessToken).toMatch(/^v2:/);
    });

    it('updates refreshToken when present in the entity', async () => {
      const repo = makeRepo();
      const token = await buildToken();
      const input = repo.publicToUpdateInput('id', token);
      expect(input.refreshToken).toMatch(/^v2:/);
    });

    it('does not include refreshToken key when null', async () => {
      const repo = makeRepo();
      const token = await buildToken({ refreshToken: null });
      const input = repo.publicToUpdateInput('id', token);
      expect(input.refreshToken).toBeUndefined();
    });
  });

  describe('toUniqueWhere()', () => {
    it('returns { id } for the given id', () => {
      const repo = makeRepo();
      expect(repo.publicToUniqueWhere('token-uuid')).toEqual({ id: 'token-uuid' });
    });
  });

  describe('toFilterWhere()', () => {
    it('returns an empty object for no filter', () => {
      const repo = makeRepo();
      expect(repo.publicToFilterWhere()).toEqual({});
    });

    it('applies provider filter', () => {
      const repo = makeRepo();
      const where = repo.publicToFilterWhere({ provider: 'google' });
      expect(where.provider).toBe('google');
    });

    it('applies email filter', () => {
      const repo = makeRepo();
      const where = repo.publicToFilterWhere({ email: 'user@example.com' });
      expect(where.email).toBe('user@example.com');
    });

    it('applies ownerSub filter', () => {
      const repo = makeRepo();
      const where = repo.publicToFilterWhere({ ownerSub: 'sub-123' });
      expect(where.ownerSub).toBe('sub-123');
    });

    it('applies scope with contains filter', () => {
      const repo = makeRepo();
      const where = repo.publicToFilterWhere({ scope: 'openid' });
      expect(where.scope).toEqual(expect.objectContaining({ contains: 'openid' }));
    });

    it('applies clientId filter', () => {
      const repo = makeRepo();
      const where = repo.publicToFilterWhere({ clientId: 'client-1' });
      expect(where.clientId).toBe('client-1');
    });
  });

  describe('supportsSoftDelete()', () => {
    it('returns false (tokens are hard-deleted)', () => {
      const repo = makeRepo();
      expect(repo.publicSupportsSoftDelete()).toBe(false);
    });
  });

  describe('defaultOrderBy()', () => {
    it('orders by createdAt desc', () => {
      const repo = makeRepo();
      expect(repo.publicDefaultOrderBy()).toEqual({ createdAt: 'desc' });
    });
  });
});
