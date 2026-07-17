import { Inject, Injectable } from '@nestjs/common';
import {
  CreateWorkflowOutboxInput,
  IWorkflowOutboxRepository,
  WorkflowOutboxRecord,
} from '../domain/ports/workflow-outbox.repository';

@Injectable()
export class OutboxDispatcherService {
  constructor(
    @Inject(IWorkflowOutboxRepository)
    private readonly outboxRepo: IWorkflowOutboxRepository,
  ) {}

  async write(input: CreateWorkflowOutboxInput): Promise<WorkflowOutboxRecord> {
    return this.outboxRepo.create(input);
  }

  async writeMany(inputs: CreateWorkflowOutboxInput[]): Promise<WorkflowOutboxRecord[]> {
    return Promise.all(inputs.map((input) => this.outboxRepo.create(input)));
  }
}
