import { Inject, Injectable } from '@nestjs/common';
import {
  AppendWorkflowEventInput,
  IWorkflowEventLogRepository,
  WorkflowEventLogEntry,
} from '../../domain/ports/workflow-event-log.repository';

@Injectable()
export class EventLogService {
  constructor(
    @Inject(IWorkflowEventLogRepository)
    private readonly eventLogRepo: IWorkflowEventLogRepository,
  ) {}

  async append(input: AppendWorkflowEventInput): Promise<WorkflowEventLogEntry> {
    return this.eventLogRepo.append(input);
  }

  async appendMany(inputs: AppendWorkflowEventInput[]): Promise<WorkflowEventLogEntry[]> {
    return this.eventLogRepo.appendMany(inputs);
  }

  async getTimeline(
    instanceId: string,
    options?: { fromSequence?: number; limit?: number },
  ): Promise<WorkflowEventLogEntry[]> {
    return this.eventLogRepo.findByInstance(instanceId, options);
  }
}
