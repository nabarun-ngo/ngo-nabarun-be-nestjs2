import { OAuthAccountPrismaRepository } from './oauth-account.prisma-repository';
import { OAuthAccount } from '@nabarun-ngo/nestjs-shared-token-vault/domain/aggregates/oauth-account/oauth-account.aggregate';

class TestableOAuthAccountRepo extends OAuthAccountPrismaRepository {
  publicToDomain(row: any): OAuthAccount {
    return this['toDomain'](row);
  }
  publicToCreateInput(entity: OAuthAccount): any {
    return this['toCreateInput'](entity);
  }
  publicToUpdateInput(id: string, entity: OAuthAccount): any {
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

function makeRepo(): TestableOAuthAccountRepo {
  const database = { getClient: jest.fn() };
  return new TestableOAuthAccountRepo(database as any);
}

const NOW = new Date('2024-06-01T12:00:00.000Z');

const baseRow = {
  id: 'account-uuid',
  provider: 'google',
  email: 'user@example.com',
  externalId: 'sub-123',
  name: 'Alice Example',
  givenName: 'Alice',
  familyName: 'Example',
  pictureUrl: 'https://example.com/alice.png',
  locale: 'en-US',
  createdAt: new Date('2024-01-01'),
  updatedAt: NOW,
  deletedAt: null,
};

describe('OAuthAccountPrismaRepository — mapping hooks', () => {
  describe('toDomain()', () => {
    it('reconstructs an OAuthAccount from a Prisma row', () => {
      const repo = makeRepo();
      const account = repo.publicToDomain(baseRow);

      expect(account).toBeInstanceOf(OAuthAccount);
      expect(account.id).toBe('account-uuid');
      expect(account.provider).toBe('google');
      expect(account.email).toBe('user@example.com');
      expect(account.externalId).toBe('sub-123');
      expect(account.name).toBe('Alice Example');
      expect(account.givenName).toBe('Alice');
      expect(account.familyName).toBe('Example');
      expect(account.pictureUrl).toBe('https://example.com/alice.png');
      expect(account.locale).toBe('en-US');
    });

    it('maps null optional fields to undefined on the domain model', () => {
      const repo = makeRepo();
      const row = {
        ...baseRow,
        externalId: null,
        name: null,
        givenName: null,
        familyName: null,
        pictureUrl: null,
        locale: null,
      };
      const account = repo.publicToDomain(row);

      expect(account.externalId).toBeUndefined();
      expect(account.name).toBeUndefined();
      expect(account.givenName).toBeUndefined();
      expect(account.familyName).toBeUndefined();
      expect(account.pictureUrl).toBeUndefined();
      expect(account.locale).toBeUndefined();
    });

    it('preserves timestamps from the row', () => {
      const repo = makeRepo();
      const account = repo.publicToDomain(baseRow);
      expect(account.updatedAt).toEqual(NOW);
    });
  });

  describe('toCreateInput()', () => {
    it('maps all domain fields to a Prisma create payload', () => {
      const repo = makeRepo();
      const account = OAuthAccount.create('google', {
        email: 'alice@example.com',
        externalId: 'sub-456',
        name: 'Alice',
        givenName: 'Alice',
        familyName: 'Smith',
        pictureUrl: 'https://img.example.com/alice.png',
        locale: 'fr-FR',
      });
      const input = repo.publicToCreateInput(account);

      expect(input.id).toBe(account.id);
      expect(input.provider).toBe('google');
      expect(input.email).toBe('alice@example.com');
      expect(input.externalId).toBe('sub-456');
      expect(input.name).toBe('Alice');
      expect(input.givenName).toBe('Alice');
      expect(input.familyName).toBe('Smith');
      expect(input.pictureUrl).toBe('https://img.example.com/alice.png');
      expect(input.locale).toBe('fr-FR');
    });

    it('sets optional fields to null when absent on the domain model', () => {
      const repo = makeRepo();
      const account = OAuthAccount.create('microsoft', { email: 'bob@example.com' });
      const input = repo.publicToCreateInput(account);

      expect(input.externalId).toBeNull();
      expect(input.name).toBeNull();
      expect(input.givenName).toBeNull();
      expect(input.familyName).toBeNull();
      expect(input.pictureUrl).toBeNull();
      expect(input.locale).toBeNull();
    });
  });

  describe('toUpdateInput()', () => {
    it('maps updated profile fields and excludes id', () => {
      const repo = makeRepo();
      const account = OAuthAccount.create('google', {
        email: 'updated@example.com',
        name: 'Updated Name',
      });
      const input = repo.publicToUpdateInput('account-uuid', account);

      expect((input as any).id).toBeUndefined();
      expect(input.email).toBe('updated@example.com');
      expect(input.name).toBe('Updated Name');
    });

    it('updates optional fields to null when absent', () => {
      const repo = makeRepo();
      const account = OAuthAccount.create('google', { email: 'user@example.com' });
      const input = repo.publicToUpdateInput('id', account);

      expect(input.name).toBeNull();
      expect(input.externalId).toBeNull();
    });
  });

  describe('toUniqueWhere()', () => {
    it('returns { id } for the given id', () => {
      const repo = makeRepo();
      expect(repo.publicToUniqueWhere('account-uuid')).toEqual({ id: 'account-uuid' });
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

    it('combines provider and email filters', () => {
      const repo = makeRepo();
      const where = repo.publicToFilterWhere({ provider: 'microsoft', email: 'bob@example.com' });
      expect(where.provider).toBe('microsoft');
      expect(where.email).toBe('bob@example.com');
    });
  });

  describe('supportsSoftDelete()', () => {
    it('returns true (accounts have a deletedAt column)', () => {
      const repo = makeRepo();
      expect(repo.publicSupportsSoftDelete()).toBe(true);
    });
  });

  describe('defaultOrderBy()', () => {
    it('orders by createdAt desc', () => {
      const repo = makeRepo();
      expect(repo.publicDefaultOrderBy()).toEqual({ createdAt: 'desc' });
    });
  });
});
