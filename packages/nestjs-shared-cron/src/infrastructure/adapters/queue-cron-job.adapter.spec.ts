/**
 * QueueCronJobAdapter unit tests — mock QueueProcessingService.
 *
 * Covers: deterministic jobId generation, payload forwarding, option setting.
 */

// Mock @ce/nestjs-shared-queue to avoid the transitive @nestjs/axios → axios peer-dep chain
jest.mock('@ce/nestjs-shared-queue', () => ({
  QueueProcessingService: class QueueProcessingService {},
  QueueModule: { forRoot: () => ({ module: class QueueModule {} }) },
}));

import { QueueCronJobAdapter } from './queue-cron-job.adapter';
import { QueueProcessingService } from '@ce/nestjs-shared-queue';

function buildAdapter() {
  const queueProcessing: jest.Mocked<QueueProcessingService> = {
    addJob: jest.fn().mockResolvedValue({ id: 'bullmq-job-789' }),
  } as any;
  const adapter = new QueueCronJobAdapter(queueProcessing);
  return { adapter, queueProcessing };
}

describe('QueueCronJobAdapter', () => {
  describe('enqueue()', () => {
    it('calls queueProcessing.addJob with the handler name as the job name', async () => {
      const { adapter, queueProcessing } = buildAdapter();

      await adapter.enqueue('send-digest', 'SendDigestJob', {});

      expect(queueProcessing.addJob).toHaveBeenCalledWith(
        'SendDigestJob',
        expect.anything(),
        expect.anything(),
      );
    });

    it('passes the payload to queueProcessing.addJob', async () => {
      const { adapter, queueProcessing } = buildAdapter();
      const payload = { region: 'eu', batchSize: 100 };

      await adapter.enqueue('send-digest', 'SendDigestJob', payload);

      expect(queueProcessing.addJob).toHaveBeenCalledWith(
        expect.anything(),
        payload,
        expect.anything(),
      );
    });

    it('returns the BullMQ job id wrapped in { id }', async () => {
      const { adapter } = buildAdapter();

      const result = await adapter.enqueue('send-digest', 'SendDigestJob', {});

      expect(result).toEqual({ id: 'bullmq-job-789' });
    });

    it('builds a deterministic jobId from cronName + scheduledAt when scheduledAt is provided', async () => {
      const { adapter, queueProcessing } = buildAdapter();
      const scheduledAt = new Date('2026-01-01T10:00:00.000Z');

      await adapter.enqueue('send-digest', 'SendDigestJob', {}, scheduledAt);

      const [, , options] = queueProcessing.addJob.mock.calls[0]!;
      expect(options!.jobId).toBe(`send-digest:${scheduledAt.getTime()}`);
    });

    it('uses a timestamp-based jobId when scheduledAt is not provided', async () => {
      const { adapter, queueProcessing } = buildAdapter();

      await adapter.enqueue('send-digest', 'SendDigestJob', {});

      const [, , options] = queueProcessing.addJob.mock.calls[0]!;
      expect(typeof options!.jobId).toBe('string');
      expect(options!.jobId).toMatch(/^send-digest:\d+$/);
    });

    it('two calls with the same scheduledAt produce the same deterministic jobId', async () => {
      const { adapter, queueProcessing } = buildAdapter();
      const scheduledAt = new Date('2026-01-01T10:00:00.000Z');

      await adapter.enqueue('send-digest', 'SendDigestJob', {}, scheduledAt);
      await adapter.enqueue('send-digest', 'SendDigestJob', {}, scheduledAt);

      const firstJobId = queueProcessing.addJob.mock.calls[0]![2]!.jobId;
      const secondJobId = queueProcessing.addJob.mock.calls[1]![2]!.jobId;
      expect(firstJobId).toBe(secondJobId);
    });

    it('two calls with different scheduledAt produce different jobIds', async () => {
      const { adapter, queueProcessing } = buildAdapter();
      const scheduledAt1 = new Date('2026-01-01T10:00:00.000Z');
      const scheduledAt2 = new Date('2026-01-01T11:00:00.000Z');

      await adapter.enqueue('send-digest', 'SendDigestJob', {}, scheduledAt1);
      await adapter.enqueue('send-digest', 'SendDigestJob', {}, scheduledAt2);

      const firstJobId = queueProcessing.addJob.mock.calls[0]![2]!.jobId;
      const secondJobId = queueProcessing.addJob.mock.calls[1]![2]!.jobId;
      expect(firstJobId).not.toBe(secondJobId);
    });

    it('forwards an empty payload object when payload is omitted', async () => {
      const { adapter, queueProcessing } = buildAdapter();

      await adapter.enqueue('send-digest', 'SendDigestJob');

      expect(queueProcessing.addJob).toHaveBeenCalledWith(
        expect.anything(),
        {},
        expect.anything(),
      );
    });
  });
});
