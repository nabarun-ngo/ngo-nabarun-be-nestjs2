import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStuckWorkflowsQuery } from './get-stuck-workflows.query';
import { IWorkflowInstanceRepository } from '../../../domain/ports/workflow-instance.repository';
import { WorkflowInstanceStatus } from '../../../domain/enums/workflow-instance-status.enum';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@QueryHandler(GetStuckWorkflowsQuery)
@Injectable()
export class GetStuckWorkflowsHandler
  implements IQueryHandler<GetStuckWorkflowsQuery, WorkflowInstanceRecord[]>
{
  constructor(
    @Inject(IWorkflowInstanceRepository)
    private readonly instanceRepo: IWorkflowInstanceRepository,
  ) {}

  async execute(query: GetStuckWorkflowsQuery): Promise<WorkflowInstanceRecord[]> {
    const cutoff = new Date(Date.now() - query.olderThanMinutes * 60_000);
    const running = await this.instanceRepo.findAll({ status: WorkflowInstanceStatus.Running });
    return running.filter((i) => i.updatedAt < cutoff);
  }
}
