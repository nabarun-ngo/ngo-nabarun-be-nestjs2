import 'reflect-metadata';
import { JsonDocumentPrismaRepository } from './json-document.prisma-repository';
import { JsonDocument } from '@ce/nestjs-shared-json-store/domain/aggregates/json-document.aggregate';

// ─── types ────────────────────────────────────────────────────────────────────

type JsonStoreDocumentRow = {
  id: string;
  key: string;
  namespace: string;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function makePrismaRow(overrides: Partial<JsonStoreDocumentRow> = {}): JsonStoreDocumentRow {
  return {
    id: 'row-id-1',
    key: 'welcome-email',
    namespace: 'correspondence',
    payload: { subject: 'Hello' },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
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
    client: { jsonStoreDocument: mockDelegate },
  };

  const repo = new JsonDocumentPrismaRepository(mockDatabase as any);
  return { repo, mockDelegate };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('JsonDocumentPrismaRepository', () => {
  describe('toDomain()', () => {
    it('maps a Prisma row to a JsonDocument aggregate', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow();

      const domain = (repo as any).toDomain(row) as JsonDocument;

      expect(domain).toBeInstanceOf(JsonDocument);
      expect(domain.id).toBe('row-id-1');
      expect(domain.key).toBe('welcome-email');
      expect(domain.namespace).toBe('correspondence');
      expect(domain.payload).toEqual({ subject: 'Hello' });
    });

    it('maps createdAt and updatedAt from the row', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      });

      const domain = (repo as any).toDomain(row) as JsonDocument;

      expect(domain.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
      expect(domain.updatedAt).toEqual(new Date('2026-06-01T00:00:00Z'));
    });

    it('falls back to empty object when payload is null/undefined', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ payload: null as any });

      const domain = (repo as any).toDomain(row) as JsonDocument;

      expect(domain.payload).toEqual({});
    });
  });

  describe('toCreateInput()', () => {
    it('maps all required fields for a Prisma create operation', () => {
      const { repo } = buildRepository();
      const doc = JsonDocument.create({
        key: 'welcome-email',
        namespace: 'correspondence',
        payload: { subject: 'Hello' },
      });

      const input = (repo as any).toCreateInput(doc) as Record<string, unknown>;

      expect(input.id).toBe(doc.id);
      expect(input.key).toBe('welcome-email');
      expect(input.namespace).toBe('correspondence');
      expect(input.payload).toEqual({ subject: 'Hello' });
    });

    it('includes createdAt and updatedAt in the create payload', () => {
      const { repo } = buildRepository();
      const doc = JsonDocument.create({ key: 'k', namespace: 'ns', payload: {} });

      const input = (repo as any).toCreateInput(doc) as Record<string, unknown>;

      expect(input.createdAt).toBeInstanceOf(Date);
      expect(input.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('toUpdateInput()', () => {
    it('maps only payload and updatedAt (immutable fields excluded)', () => {
      const { repo } = buildRepository();
      const doc = new JsonDocument(
        'doc-id',
        'original-key',
        'original-ns',
        { value: 42 },
        new Date('2026-01-01'),
        new Date('2026-06-01'),
      );

      const input = (repo as any).toUpdateInput('doc-id', doc) as Record<string, unknown>;

      expect(input.payload).toEqual({ value: 42 });
      expect(input.updatedAt).toBeInstanceOf(Date);
    });

    it('does not include id, key, or namespace in the update payload', () => {
      const { repo } = buildRepository();
      const doc = new JsonDocument('doc-id', 'k', 'ns', {}, new Date(), new Date());

      const input = (repo as any).toUpdateInput('doc-id', doc) as Record<string, unknown>;

      expect(input).not.toHaveProperty('id');
      expect(input).not.toHaveProperty('key');
      expect(input).not.toHaveProperty('namespace');
    });
  });

  describe('toUniqueWhere()', () => {
    it('returns { id } clause for the given id', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toUniqueWhere('doc-uuid-1');

      expect(where).toEqual({ id: 'doc-uuid-1' });
    });
  });

  describe('toFilterWhere()', () => {
    it('returns empty object when filter is undefined', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere(undefined);

      expect(where).toEqual({});
    });

    it('returns empty object when filter has no fields', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere({});

      expect(where).toEqual({});
    });

    it('includes namespace filter when provided', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere({ namespace: 'correspondence' });

      expect(where).toEqual({ namespace: 'correspondence' });
    });

    it('includes key filter when provided', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere({ key: 'welcome-email' });

      expect(where).toEqual({ key: 'welcome-email' });
    });

    it('includes both namespace and key when both are provided', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere({
        namespace: 'correspondence',
        key: 'welcome-email',
      });

      expect(where).toEqual({ namespace: 'correspondence', key: 'welcome-email' });
    });
  });

  describe('supportsSoftDelete()', () => {
    it('returns false — the table has no deletedAt column', () => {
      const { repo } = buildRepository();

      expect((repo as any).supportsSoftDelete()).toBe(false);
    });
  });

  describe('findByKey()', () => {
    it('queries with the composite unique index where clause', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makePrismaRow();
      mockDelegate.findUnique.mockResolvedValue(row);

      await repo.findByKey('welcome-email', 'correspondence');

      expect(mockDelegate.findUnique).toHaveBeenCalledWith({
        where: {
          json_store_key_namespace_unique: {
            key: 'welcome-email',
            namespace: 'correspondence',
          },
        },
      });
    });

    it('returns a JsonDocument aggregate on hit', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findUnique.mockResolvedValue(makePrismaRow());

      const result = await repo.findByKey('welcome-email', 'correspondence');

      expect(result).toBeInstanceOf(JsonDocument);
      expect(result!.key).toBe('welcome-email');
    });

    it('returns null on miss', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findUnique.mockResolvedValue(null);

      const result = await repo.findByKey('nonexistent', 'ns');

      expect(result).toBeNull();
    });
  });

  describe('findByNamespace()', () => {
    it('queries with the namespace filter and ascending key ordering', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findMany.mockResolvedValue([]);

      await repo.findByNamespace('correspondence');

      expect(mockDelegate.findMany).toHaveBeenCalledWith({
        where: { namespace: 'correspondence' },
        orderBy: { key: 'asc' },
      });
    });

    it('returns an array of JsonDocument aggregates', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findMany.mockResolvedValue([
        makePrismaRow({ id: 'id-1', key: 'a' }),
        makePrismaRow({ id: 'id-2', key: 'b' }),
      ]);

      const results = await repo.findByNamespace('correspondence');

      expect(results).toHaveLength(2);
      results.forEach((r) => expect(r).toBeInstanceOf(JsonDocument));
    });

    it('returns an empty array when namespace has no documents', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findMany.mockResolvedValue([]);

      const results = await repo.findByNamespace('empty-ns');

      expect(results).toEqual([]);
    });
  });
});
