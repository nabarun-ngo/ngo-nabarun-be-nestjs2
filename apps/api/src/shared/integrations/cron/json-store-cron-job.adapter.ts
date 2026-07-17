import { Injectable, Logger } from '@nestjs/common';
import { CronJob, CRON_JOB_STORE_PORT, CronJobPayloadSchema, ICronJobStorePort } from '@ce/nestjs-shared-cron';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';

const NAMESPACE = 'cron';

@Injectable()
export class JsonStoreCronJobAdapter implements ICronJobStorePort {
  private readonly logger = new Logger(JsonStoreCronJobAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async findAll(): Promise<CronJob[]> {
    const docs = await this.jsonStore.list(NAMESPACE);
    const jobs: CronJob[] = [];

    for (const doc of docs) {
      const parsed = CronJobPayloadSchema.safeParse(doc.payload);
      if (!parsed.success) {
        this.logger.warn(`Invalid cron job payload for ${NAMESPACE}/${doc.key}`);
        continue;
      }
      jobs.push(parsed.data);
    }

    return jobs;
  }

  async findByName(name: string): Promise<CronJob | null> {
    const payload = await this.jsonStore.get(name, NAMESPACE);
    if (!payload) return null;

    const parsed = CronJobPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid cron job payload for ${NAMESPACE}/${name}`);
      return null;
    }

    return parsed.data;
  }

  async upsert(job: CronJob): Promise<CronJob> {
    await this.jsonStore.upsert(job.name, NAMESPACE, job as unknown as Record<string, unknown>);
    return job;
  }

  async delete(name: string): Promise<void> {
    const doc = await this.jsonStore.getDto(name, NAMESPACE);
    if (doc) {
      await this.jsonStore.delete(doc.id);
    }
  }
}

export const CRON_JOB_STORE_PROVIDER = {
  provide: CRON_JOB_STORE_PORT,
  useClass: JsonStoreCronJobAdapter,
};
