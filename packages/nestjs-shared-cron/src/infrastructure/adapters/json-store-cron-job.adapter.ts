import { Injectable } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import { CronJob } from '../../domain/models/cron-job.model';
import { ICronJobStorePort } from '../../domain/ports/cron-job-store.port';

const NAMESPACE = 'cron';

@Injectable()
export class JsonStoreCronJobAdapter implements ICronJobStorePort {
  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async findAll(): Promise<CronJob[]> {
    const docs = await this.jsonStore.list(NAMESPACE);
    return docs.map((doc) => doc.payload as unknown as CronJob);
  }

  async findByName(name: string): Promise<CronJob | null> {
    const payload = await this.jsonStore.get(name, NAMESPACE);
    return payload ? (payload as unknown as CronJob) : null;
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
