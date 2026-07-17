import 'reflect-metadata';
import { RolePrismaRepository } from './role.prisma-repository';
import { Role } from '@ce/nestjs-shared-auth/domain/aggregates/role/role.aggregate';

type RoleRow = {
  id: string;
  key: string;
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  permissions?: Array<{ permission: { key: string } }>;
};

function makePrismaRow(overrides: Partial<RoleRow> = {}): RoleRow {
  return {
    id: 'role-id-1',
    key: 'admin',
    description: 'Administrator role',
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
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
    client: { authRole: mockDelegate },
  };

  const repo = new RolePrismaRepository(mockDatabase as any);
  return { repo, mockDelegate };
}

describe('RolePrismaRepository', () => {
  describe('toDomain()', () => {
    it('maps a Prisma row to a Role aggregate', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow();

      const domain = (repo as any).toDomain(row) as Role;

      expect(domain).toBeInstanceOf(Role);
      expect(domain.id).toBe('role-id-1');
      expect(domain.key).toBe('admin');
      expect(domain.description).toBe('Administrator role');
      expect(domain.isDeleted()).toBe(false);
    });

    it('maps permission join rows into permissionKeys', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({
        permissions: [
          { permission: { key: 'read:roles' } },
          { permission: { key: 'create:api_keys' } },
        ],
      });

      const domain = (repo as any).toDomain(row) as Role;

      expect(domain.permissionKeys).toEqual(['read:roles', 'create:api_keys']);
    });

    it('starts with empty permissionKeys when join is absent', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ permissions: undefined });

      const domain = (repo as any).toDomain(row) as Role;

      expect(domain.permissionKeys).toEqual([]);
    });

    it('marks the role as deleted when deletedAt is set', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ deletedAt: new Date('2025-01-01') });

      const domain = (repo as any).toDomain(row) as Role;

      expect(domain.isDeleted()).toBe(true);
    });

    it('converts null description to undefined', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ description: null });

      const domain = (repo as any).toDomain(row) as Role;

      expect(domain.description).toBeUndefined();
    });
  });

  describe('toCreateInput()', () => {
    it('maps domain fields to Prisma create payload', () => {
      const { repo } = buildRepository();
      const role = Role.create({ key: 'editor', description: 'Editor role' });

      const input = (repo as any).toCreateInput(role) as Record<string, unknown>;

      expect(input.id).toBe(role.id);
      expect(input.key).toBe('editor');
      expect(input.description).toBe('Editor role');
    });

    it('maps undefined description to null', () => {
      const { repo } = buildRepository();
      const role = Role.create({ key: 'editor' });

      const input = (repo as any).toCreateInput(role) as Record<string, unknown>;

      expect(input.description).toBeNull();
    });
  });

  describe('toUpdateInput()', () => {
    it('maps updatable fields (description, deletedAt) to Prisma update payload', () => {
      const { repo } = buildRepository();
      const role = Role.create({ key: 'admin', description: 'Updated' });
      role.softDelete();

      const input = (repo as any).toUpdateInput('role-id-1', role) as Record<string, unknown>;

      expect(input.description).toBe('Updated');
      expect(input.deletedAt).toBeDefined();
      expect(input).not.toHaveProperty('id');
      expect(input).not.toHaveProperty('key');
    });
  });

  describe('supportsSoftDelete()', () => {
    it('returns true', () => {
      const { repo } = buildRepository();

      expect((repo as any).supportsSoftDelete()).toBe(true);
    });
  });

  describe('findByKey()', () => {
    it('queries delegate with key and returns a domain entity on hit', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makePrismaRow({ key: 'admin' });
      mockDelegate.findUnique.mockResolvedValue(row);

      const result = await repo.findByKey('admin');

      expect(mockDelegate.findUnique).toHaveBeenCalledWith({ where: { key: 'admin' } });
      expect(result).toBeInstanceOf(Role);
      expect(result!.key).toBe('admin');
    });

    it('returns null when the key is not found', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findUnique.mockResolvedValue(null);

      const result = await repo.findByKey('nonexistent');

      expect(result).toBeNull();
    });
  });
});
