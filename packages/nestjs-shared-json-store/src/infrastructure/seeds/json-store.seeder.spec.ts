import 'reflect-metadata';
import { seedJsonStore } from './json-store.seeder';
import { JsonStoreSeedData } from './json-store-seed.types';

function buildPrisma() {
  return {
    jsonStoreDocument: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  };
}

type MockPrisma = ReturnType<typeof buildPrisma>;

describe('seedJsonStore', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = buildPrisma();
  });

  it('calls upsert once for each document in the seed data', async () => {
    const data: JsonStoreSeedData = {
      documents: [
        { namespace: 'correspondence', key: 'welcome-email', payload: { subject: 'Welcome!' } },
        { namespace: 'cron', key: 'daily-report', payload: { schedule: '0 6 * * *' } },
      ],
    };

    await seedJsonStore(prisma as any, data);

    expect(prisma.jsonStoreDocument.upsert).toHaveBeenCalledTimes(2);
  });

  it('does nothing when documents array is empty', async () => {
    await seedJsonStore(prisma as any, { documents: [] });

    expect(prisma.jsonStoreDocument.upsert).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // onConflict: 'upsert' (default)
  // ─────────────────────────────────────────────────────────────────────────

  describe("onConflict: 'upsert' (default)", () => {
    it('overwrites the payload when onConflict is upsert', async () => {
      const payload = { subject: 'Welcome!' };
      const data: JsonStoreSeedData = {
        documents: [{ namespace: 'my-ns', key: 'my-key', payload, onConflict: 'upsert' }],
      };

      await seedJsonStore(prisma as any, data);

      expect(prisma.jsonStoreDocument.upsert).toHaveBeenCalledWith({
        where: { json_store_key_namespace_unique: { key: 'my-key', namespace: 'my-ns' } },
        update: { payload },
        create: { key: 'my-key', namespace: 'my-ns', payload },
      });
    });

    it('defaults to upsert strategy when onConflict is omitted', async () => {
      const payload = { value: 42 };
      const data: JsonStoreSeedData = {
        documents: [{ namespace: 'my-ns', key: 'my-key', payload }],
      };

      await seedJsonStore(prisma as any, data);

      expect(prisma.jsonStoreDocument.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { payload } }),
      );
    });

    it('overwrites payload on every subsequent run', async () => {
      const payload = { subject: 'Hello', htmlTemplate: '<p>Hi</p>' };
      const data: JsonStoreSeedData = {
        documents: [{ namespace: 'correspondence', key: 'onboarding', payload }],
      };

      await seedJsonStore(prisma as any, data);
      await seedJsonStore(prisma as any, data);

      expect(prisma.jsonStoreDocument.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.jsonStoreDocument.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ update: { payload } }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // onConflict: 'skip-if-exists'
  // ─────────────────────────────────────────────────────────────────────────

  describe("onConflict: 'skip-if-exists'", () => {
    it('passes an empty update object so existing payload is never overwritten', async () => {
      const payload = { newDashboard: false };
      const data: JsonStoreSeedData = {
        documents: [
          { namespace: 'config', key: 'feature-flags', payload, onConflict: 'skip-if-exists' },
        ],
      };

      await seedJsonStore(prisma as any, data);

      expect(prisma.jsonStoreDocument.upsert).toHaveBeenCalledWith({
        where: {
          json_store_key_namespace_unique: { key: 'feature-flags', namespace: 'config' },
        },
        update: {},
        create: { key: 'feature-flags', namespace: 'config', payload },
      });
    });

    it('still creates the document on first deploy via the create branch', async () => {
      const payload = { threshold: 100 };
      const data: JsonStoreSeedData = {
        documents: [{ namespace: 'ns', key: 'k', payload, onConflict: 'skip-if-exists' }],
      };

      await seedJsonStore(prisma as any, data);

      expect(prisma.jsonStoreDocument.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { key: 'k', namespace: 'ns', payload },
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Mixed strategies in one seed run
  // ─────────────────────────────────────────────────────────────────────────

  describe('mixed strategies in one seed run', () => {
    it('applies the correct strategy per document', async () => {
      const data: JsonStoreSeedData = {
        documents: [
          {
            namespace: 'correspondence',
            key: 'welcome-email',
            payload: { subject: 'Welcome!' },
            onConflict: 'upsert',
          },
          {
            namespace: 'config',
            key: 'feature-flags',
            payload: { newDashboard: false },
            onConflict: 'skip-if-exists',
          },
        ],
      };

      await seedJsonStore(prisma as any, data);

      const calls = prisma.jsonStoreDocument.upsert.mock.calls;
      expect(calls[0][0].update).toEqual({ payload: { subject: 'Welcome!' } });
      expect(calls[1][0].update).toEqual({});
    });
  });
});
