import 'reflect-metadata';
import { ApiKeyPrismaRepository } from './api-key.prisma-repository';
import { ApiKey } from '@nabarun-ngo/nestjs-shared-auth/domain/aggregates/api-key/api-key.aggregate';

type PrismaApiKeyRow = {
  id: string;
  name: string;
  apiKey: string;
  apiKeyId: string;
  permissions: string[];
  createdBy: string | null;
  ownerId: string | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function makePrismaRow(overrides: Partial<PrismaApiKeyRow> = {}): PrismaApiKeyRow {
  return {
    id: 'row-id-1',
    name: 'test-key',
    apiKey: 'hashed-secret',
    apiKeyId: 'kid-abc',
    permissions: ['read:roles'],
    createdBy: 'creator|1',
    ownerId: 'owner|1',
    expiresAt: new Date('2030-01-01'),
    lastUsedAt: new Date('2026-06-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-06-01'),
    ...overrides,
  };
}

function makeApiKey(
  overrides: Partial<{
    id: string;
    key: string;
    keyId: string;
    name: string;
    permissions: string[];
    ownerId: string;
    createdBy: string;
  }> = {},
): ApiKey {
  return new ApiKey({
    id: 'key-id-1',
    key: 'hashed-secret',
    keyId: 'kid-abc',
    name: 'my-key',
    permissions: ['read:roles'],
    ownerId: 'owner|1',
    createdBy: 'creator|1',
    ...overrides,
  });
}

function buildRepository() {
  const mockDelegate = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  const mockDatabase = {
    client: { authApiKey: mockDelegate },
  };

  const repo = new ApiKeyPrismaRepository(mockDatabase as any);
  return { repo, mockDelegate };
}

describe('ApiKeyPrismaRepository', () => {
  describe('toDomain()', () => {
    it('maps a Prisma row to an ApiKey aggregate', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow();

      const domain = (repo as any).toDomain(row) as ApiKey;

      expect(domain).toBeInstanceOf(ApiKey);
      expect(domain.id).toBe('row-id-1');
      expect(domain.name).toBe('test-key');
      // DB column `apiKey` → domain field `key`
      expect(domain.key).toBe('hashed-secret');
      // DB column `apiKeyId` → domain field `keyId`
      expect(domain.keyId).toBe('kid-abc');
      expect(domain.permissions).toEqual(['read:roles']);
      expect(domain.createdBy).toBe('creator|1');
      expect(domain.ownerId).toBe('owner|1');
      expect(domain.expiresAt).toEqual(new Date('2030-01-01'));
      expect(domain.lastUsedAt).toEqual(new Date('2026-06-01'));
    });

    it('converts null nullable fields to undefined', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({
        createdBy: null,
        ownerId: null,
        expiresAt: null,
        lastUsedAt: null,
      });

      const domain = (repo as any).toDomain(row) as ApiKey;

      expect(domain.createdBy).toBeUndefined();
      expect(domain.ownerId).toBeUndefined();
      expect(domain.expiresAt).toBeUndefined();
      expect(domain.lastUsedAt).toBeUndefined();
    });
  });

  describe('toCreateInput()', () => {
    it('maps domain fields to Prisma create payload', () => {
      const { repo } = buildRepository();
      const keyInfo = makeApiKey();

      const input = (repo as any).toCreateInput(keyInfo) as Record<string, unknown>;

      expect(input.id).toBe(keyInfo.id);
      expect(input.name).toBe('my-key');
      expect(input.apiKey).toBe(keyInfo.key);
      expect(input.apiKeyId).toBe(keyInfo.keyId);
      expect(input.permissions).toEqual(['read:roles']);
      expect(input.ownerId).toBe('owner|1');
      expect(input.createdBy).toBe('creator|1');
    });

    it('maps undefined optional fields to null in the payload', () => {
      const { repo } = buildRepository();
      const keyInfo = makeApiKey({
        name: 'no-opts',
        permissions: [],
        ownerId: undefined,
        createdBy: undefined,
      });

      const input = (repo as any).toCreateInput(keyInfo) as Record<string, unknown>;

      expect(input.ownerId).toBeNull();
      expect(input.createdBy).toBeNull();
      expect(input.expiresAt).toBeNull();
      expect(input.lastUsedAt).toBeNull();
    });
  });

  describe('toUpdateInput()', () => {
    it('maps updatable domain fields to Prisma update payload (no id in data)', () => {
      const { repo } = buildRepository();
      const keyInfo = makeApiKey({ name: 'key' });

      const input = (repo as any).toUpdateInput('some-id', keyInfo) as Record<string, unknown>;

      expect(input.name).toBe('key');
      expect(input.permissions).toEqual(['read:roles']);
      expect(input).not.toHaveProperty('id');
      expect(input).not.toHaveProperty('apiKey');
    });
  });

  describe('supportsSoftDelete()', () => {
    it('returns false', () => {
      const { repo } = buildRepository();

      expect((repo as any).supportsSoftDelete()).toBe(false);
    });
  });

  describe('findByKeyId()', () => {
    it('queries delegate with apiKeyId and returns a domain entity on hit', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makePrismaRow({ apiKeyId: 'target-kid' });
      mockDelegate.findUnique.mockResolvedValue(row);

      const result = await repo.findByKeyId('target-kid');

      expect(mockDelegate.findUnique).toHaveBeenCalledWith({ where: { apiKeyId: 'target-kid' } });
      expect(result).toBeInstanceOf(ApiKey);
      expect(result!.keyId).toBe('target-kid');
    });

    it('returns null when the key is not found', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findUnique.mockResolvedValue(null);

      const result = await repo.findByKeyId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
