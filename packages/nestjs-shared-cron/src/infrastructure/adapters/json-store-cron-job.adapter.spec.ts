/**
 * JsonStoreCronJobAdapter unit tests — mock JsonStoreFacade.
 *
 * Covers create/findAll/findByName/upsert/delete mapping to the json-store.
 * Ported from: test/cron/cron-job-definitions.service.spec.ts (repository mapping patterns)
 */

// Mock @ce/nestjs-shared-json-store to avoid the transitive @nestjs/axios → axios peer-dep chain
jest.mock('@ce/nestjs-shared-json-store', () => ({
  JsonStoreFacade: class JsonStoreFacade {},
  JsonStoreModule: { forRoot: () => ({ module: class JsonStoreModule {} }) },
}));

import { JsonStoreCronJobAdapter } from './json-store-cron-job.adapter';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import { CronJob } from '../../domain/models/cron-job.model';

const NAMESPACE = 'cron';

const sampleJob: CronJob = {
  name: 'send-digest',
  description: 'Sends the daily digest',
  expression: '0 10 * * *',
  handler: 'SendDigestJob',
  enabled: true,
  inputData: { region: 'eu' },
};

function buildAdapter() {
  const jsonStore: jest.Mocked<JsonStoreFacade> = {
    list: jest.fn(),
    get: jest.fn(),
    getDto: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  } as any;
  const adapter = new JsonStoreCronJobAdapter(jsonStore);
  return { adapter, jsonStore };
}

describe('JsonStoreCronJobAdapter', () => {
  describe('findAll()', () => {
    it('lists documents from the cron namespace', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.list.mockResolvedValue([{ payload: sampleJob }] as any);

      await adapter.findAll();

      expect(jsonStore.list).toHaveBeenCalledWith(NAMESPACE);
    });

    it('deserializes documents and returns an array of CronJob', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.list.mockResolvedValue([{ payload: sampleJob }] as any);

      const result = await adapter.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sampleJob);
    });

    it('returns an empty array when there are no documents', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.list.mockResolvedValue([]);

      const result = await adapter.findAll();

      expect(result).toEqual([]);
    });

    it('returns multiple jobs when multiple documents exist', async () => {
      const { adapter, jsonStore } = buildAdapter();
      const secondJob: CronJob = { ...sampleJob, name: 'second-job' };
      jsonStore.list.mockResolvedValue([{ payload: sampleJob }, { payload: secondJob }] as any);

      const result = await adapter.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('findByName()', () => {
    it('retrieves the payload from the json store using name and namespace', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.get.mockResolvedValue(sampleJob as any);

      await adapter.findByName('send-digest');

      expect(jsonStore.get).toHaveBeenCalledWith('send-digest', NAMESPACE);
    });

    it('returns the deserialized CronJob when found', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.get.mockResolvedValue(sampleJob as any);

      const result = await adapter.findByName('send-digest');

      expect(result).toEqual(sampleJob);
    });

    it('returns null when no document matches the name', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.get.mockResolvedValue(null);

      const result = await adapter.findByName('missing');

      expect(result).toBeNull();
    });
  });

  describe('upsert()', () => {
    it('calls jsonStore.upsert with name, namespace, and the job data', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.upsert.mockResolvedValue(undefined as any);

      await adapter.upsert(sampleJob);

      expect(jsonStore.upsert).toHaveBeenCalledWith(
        sampleJob.name,
        NAMESPACE,
        sampleJob,
      );
    });

    it('returns the job that was upserted', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.upsert.mockResolvedValue(undefined as any);

      const result = await adapter.upsert(sampleJob);

      expect(result).toEqual(sampleJob);
    });

    it('upserts with updated fields when called again for the same job', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.upsert.mockResolvedValue(undefined as any);
      const updatedJob: CronJob = { ...sampleJob, enabled: false };

      const result = await adapter.upsert(updatedJob);

      expect(jsonStore.upsert).toHaveBeenCalledWith(sampleJob.name, NAMESPACE, updatedJob);
      expect(result.enabled).toBe(false);
    });
  });

  describe('delete()', () => {
    it('looks up the document DTO by name and namespace before deleting', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.getDto.mockResolvedValue({ id: 'doc-id-1', payload: sampleJob } as any);
      jsonStore.delete.mockResolvedValue(undefined);

      await adapter.delete('send-digest');

      expect(jsonStore.getDto).toHaveBeenCalledWith('send-digest', NAMESPACE);
    });

    it('deletes the document by its DTO id', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.getDto.mockResolvedValue({ id: 'doc-id-1', payload: sampleJob } as any);
      jsonStore.delete.mockResolvedValue(undefined);

      await adapter.delete('send-digest');

      expect(jsonStore.delete).toHaveBeenCalledWith('doc-id-1');
    });

    it('does not call jsonStore.delete when no document is found', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.getDto.mockResolvedValue(null);

      await adapter.delete('non-existent');

      expect(jsonStore.delete).not.toHaveBeenCalled();
    });

    it('resolves without throwing even when the document does not exist', async () => {
      const { adapter, jsonStore } = buildAdapter();
      jsonStore.getDto.mockResolvedValue(null);

      await expect(adapter.delete('non-existent')).resolves.not.toThrow();
    });
  });
});
