/**
 * DocumentPrismaRepository unit tests.
 * Ported and updated from test/dms/document.repository.spec.ts (stale @nabarun-ngo/nestjs-shared-dms/* imports).
 * All five mapping hooks + supportsSoftDelete() are covered.
 */
import 'reflect-metadata';
import { DocumentPrismaRepository } from './document.prisma-repository';
import { Document } from '@nabarun-ngo/nestjs-shared-dms/domain/aggregates/document.aggregate';
import { DocumentMapping } from '@nabarun-ngo/nestjs-shared-dms/domain/entities/document-mapping.entity';
import { DocumentVisibility } from '@nabarun-ngo/nestjs-shared-dms/domain/enums/document-visibility.enum';

type DocumentReferenceRow = {
  id: string;
  fileName: string;
  remotePath: string;
  publicToken: string | null;
  contentType: string;
  fileSize: number | null;
  isPublic: boolean;
  uploadedById: string | null;
  storageOwnerSub: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  mappings?: Array<{ id: string; entityId: string; entityType: string; createdAt: Date }>;
};

function makePrismaRow(overrides: Partial<DocumentReferenceRow> = {}): DocumentReferenceRow {
  return {
    id: 'doc-1',
    fileName: 'report.pdf',
    remotePath: 'uploads/report.pdf',
    publicToken: 'token-abc',
    contentType: 'application/pdf',
    fileSize: 2048,
    isPublic: false,
    uploadedById: 'user-1',
    storageOwnerSub: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: null,
    deletedAt: null,
    mappings: [
      { id: 'map-1', entityId: 'entity-1', entityType: 'donation', createdAt: new Date('2024-01-01') },
    ],
    ...overrides,
  };
}

function buildRepository() {
  const mockDelegate = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  };
  const mockDatabase = {
    client: { documentReference: mockDelegate },
  };
  const repo = new DocumentPrismaRepository(mockDatabase as any);
  return { repo, mockDelegate };
}

function buildDomainDocument(overrides: {
  mappings?: DocumentMapping[];
  storageOwnerSub?: string;
  visibility?: DocumentVisibility;
  uploadedById?: string;
} = {}): Document {
  const doc = Document.create({
    fileName: 'report.pdf',
    contentType: 'application/pdf',
    fileSize: 2048,
    remotePath: 'uploads/report.pdf',
    publicToken: 'token-abc',
    mappedTo: overrides.mappings ?? [
      DocumentMapping.create({ refId: 'entity-1', refType: 'donation' }),
    ],
    visibility: overrides.visibility ?? DocumentVisibility.Private,
    uploadedById: overrides.uploadedById ?? 'user-1',
    storageOwnerSub: overrides.storageOwnerSub,
  });
  doc.clearEvents();
  return doc;
}

describe('DocumentPrismaRepository', () => {
  describe('toDomain()', () => {
    it('maps a Prisma row to a Document aggregate', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow();

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain).toBeInstanceOf(Document);
      expect(domain.id).toBe('doc-1');
      expect(domain.fileName).toBe('report.pdf');
      expect(domain.remotePath).toBe('uploads/report.pdf');
      expect(domain.publicToken).toBe('token-abc');
      expect(domain.contentType).toBe('application/pdf');
      expect(domain.fileSize).toBe(2048);
      expect(domain.visibility).toBe(DocumentVisibility.Private);
      expect(domain.uploadedById).toBe('user-1');
    });

    it('maps isPublic=true to DocumentVisibility.Public', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ isPublic: true });

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain.visibility).toBe(DocumentVisibility.Public);
      expect(domain.isPublic).toBe(true);
    });

    it('maps mappings array to DocumentMapping entities', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow();

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain.mappings).toHaveLength(1);
      expect(domain.mappings[0]).toBeInstanceOf(DocumentMapping);
      expect(domain.mappings[0].refId).toBe('entity-1');
      expect(domain.mappings[0].refType).toBe('donation');
    });

    it('handles null nullable fields (uploadedById, storageOwnerSub) converting to undefined', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ uploadedById: null, storageOwnerSub: null });

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain.uploadedById).toBeUndefined();
      expect(domain.storageOwnerSub).toBeUndefined();
    });

    it('handles null publicToken by converting to empty string', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ publicToken: null });

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain.publicToken).toBe('');
    });

    it('handles missing mappings array (returns empty list)', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ mappings: undefined });

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain.mappings).toHaveLength(0);
    });

    it('maps deletedAt when present', () => {
      const { repo } = buildRepository();
      const deletedAt = new Date('2024-06-01');
      const row = makePrismaRow({ deletedAt });

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain.deletedAt).toEqual(deletedAt);
      expect(domain.isDeleted).toBe(true);
    });

    it('maps storageOwnerSub when present', () => {
      const { repo } = buildRepository();
      const row = makePrismaRow({ storageOwnerSub: 'google-sub-1' });

      const domain = (repo as any).toDomain(row) as Document;

      expect(domain.storageOwnerSub).toBe('google-sub-1');
    });
  });

  describe('toCreateInput()', () => {
    it('maps domain fields to Prisma create payload with nested mappings', () => {
      const { repo } = buildRepository();
      const doc = buildDomainDocument();

      const input = (repo as any).toCreateInput(doc) as Record<string, any>;

      expect(input.id).toBe(doc.id);
      expect(input.fileName).toBe('report.pdf');
      expect(input.remotePath).toBe('uploads/report.pdf');
      expect(input.publicToken).toBe('token-abc');
      expect(input.contentType).toBe('application/pdf');
      expect(input.fileSize).toBe(2048);
      expect(input.isPublic).toBe(false);
      expect(input.uploadedById).toBe('user-1');
      expect(input.mappings.create).toHaveLength(1);
      expect(input.mappings.create[0].entityId).toBe('entity-1');
      expect(input.mappings.create[0].entityType).toBe('donation');
    });

    it('sets isPublic=true for Public visibility', () => {
      const { repo } = buildRepository();
      const doc = buildDomainDocument({ visibility: DocumentVisibility.Public });

      const input = (repo as any).toCreateInput(doc) as Record<string, any>;

      expect(input.isPublic).toBe(true);
    });

    it('maps storageOwnerSub when present (Google Drive upload)', () => {
      const { repo } = buildRepository();
      const doc = buildDomainDocument({ storageOwnerSub: 'google-sub-1' });

      const input = (repo as any).toCreateInput(doc) as Record<string, any>;

      expect(input.storageOwnerSub).toBe('google-sub-1');
    });

    it('maps undefined uploadedById to null', () => {
      const { repo } = buildRepository();
      // Create directly without uploadedById to produce undefined
      const doc = Document.create({
        fileName: 'report.pdf',
        contentType: 'application/pdf',
        fileSize: 2048,
        remotePath: 'uploads/report.pdf',
        publicToken: 'token-abc',
        mappedTo: [],
        visibility: DocumentVisibility.Private,
        // uploadedById intentionally omitted
      });
      doc.clearEvents();

      const input = (repo as any).toCreateInput(doc) as Record<string, any>;

      expect(input.uploadedById).toBeNull();
    });
  });

  describe('toUpdateInput()', () => {
    it('maps only mutable scalar fields — no id, no mappings re-creation', () => {
      const { repo } = buildRepository();
      const doc = buildDomainDocument();

      const input = (repo as any).toUpdateInput('doc-1', doc) as Record<string, any>;

      expect(input).not.toHaveProperty('id');
      expect(input).not.toHaveProperty('mappings');
      expect(input).toHaveProperty('fileName');
      expect(input).toHaveProperty('isPublic');
      expect(input).toHaveProperty('publicToken');
    });

    it('maps deletedAt when document is soft-deleted', () => {
      const { repo } = buildRepository();
      const doc = buildDomainDocument();
      doc.softDelete();
      doc.clearEvents();

      const input = (repo as any).toUpdateInput('doc-1', doc) as Record<string, any>;

      expect(input.deletedAt).toBeDefined();
    });

    it('maps deletedAt as null when document is not deleted', () => {
      const { repo } = buildRepository();
      const doc = buildDomainDocument();

      const input = (repo as any).toUpdateInput('doc-1', doc) as Record<string, any>;

      expect(input.deletedAt).toBeNull();
    });
  });

  describe('toUniqueWhere()', () => {
    it('returns { id } clause', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toUniqueWhere('doc-abc');

      expect(where).toEqual({ id: 'doc-abc' });
    });
  });

  describe('toFilterWhere()', () => {
    it('returns empty object when filter is undefined', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere(undefined);

      expect(where).toEqual({});
    });

    it('filters by uploadedById when provided', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere({ uploadedById: 'user-1' });

      expect(where).toEqual({ uploadedById: 'user-1' });
    });

    it('filters by mappings.some when refType and refId are provided', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere({ refType: 'donation', refId: 'entity-1' });

      expect(where).toEqual({
        mappings: { some: { entityType: 'donation', entityId: 'entity-1' } },
      });
    });

    it('filters by refType only when refId is absent', () => {
      const { repo } = buildRepository();

      const where = (repo as any).toFilterWhere({ refType: 'donation' });

      expect(where).toEqual({
        mappings: { some: { entityType: 'donation' } },
      });
    });
  });

  describe('supportsSoftDelete()', () => {
    it('returns true — the documentReference table has a deletedAt column', () => {
      const { repo } = buildRepository();

      expect((repo as any).supportsSoftDelete()).toBe(true);
    });
  });

  describe('findById() override', () => {
    it('queries delegate with findFirst + deletedAt=null + include mappings', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makePrismaRow();
      mockDelegate.findFirst.mockResolvedValue(row);

      const result = await repo.findById('doc-1');

      expect(mockDelegate.findFirst).toHaveBeenCalledWith({
        where: { id: 'doc-1', deletedAt: null },
        include: { mappings: true },
      });
      expect(result).toBeInstanceOf(Document);
    });

    it('returns null when no row matches', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findFirst.mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('create() override', () => {
    it('calls delegate.create with mapped payload + include mappings', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makePrismaRow();
      mockDelegate.create.mockResolvedValue(row);
      const doc = buildDomainDocument();

      const result = await repo.create(doc);

      expect(mockDelegate.create).toHaveBeenCalledWith(
        expect.objectContaining({ include: { mappings: true } }),
      );
      expect(result).toBeInstanceOf(Document);
    });
  });

  describe('update() override', () => {
    it('calls delegate.update with toUpdateInput payload + include mappings', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makePrismaRow();
      mockDelegate.update.mockResolvedValue(row);
      const doc = buildDomainDocument();

      const result = await repo.update('doc-1', doc);

      expect(mockDelegate.update).toHaveBeenCalledWith(
        expect.objectContaining({ include: { mappings: true } }),
      );
      expect(result).toBeInstanceOf(Document);
    });
  });

  describe('findAllByEntity()', () => {
    it('queries for non-deleted docs mapped to the entity, ordered by createdAt desc', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makePrismaRow();
      mockDelegate.findMany.mockResolvedValue([row]);

      const result = await repo.findAllByEntity('donation', 'entity-1');

      expect(mockDelegate.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          mappings: { some: { entityType: 'donation', entityId: 'entity-1' } },
        },
        include: { mappings: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Document);
    });

    it('returns empty array when no documents match', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findMany.mockResolvedValue([]);

      const result = await repo.findAllByEntity('donation', 'entity-missing');

      expect(result).toEqual([]);
    });
  });

  describe('countByEntity()', () => {
    it('counts non-deleted documents for the given entity', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.count.mockResolvedValue(3);

      const result = await repo.countByEntity('donation', 'entity-1');

      expect(mockDelegate.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          mappings: { some: { entityType: 'donation', entityId: 'entity-1' } },
        },
      });
      expect(result).toBe(3);
    });
  });
});
