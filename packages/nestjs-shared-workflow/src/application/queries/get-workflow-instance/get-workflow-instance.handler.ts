import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetWorkflowInstanceQuery } from './get-workflow-instance.query';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@QueryHandler(GetWorkflowInstanceQuery)
@Injectable()
export class GetWorkflowInstanceHandler
  implements IQueryHandler<GetWorkflowInstanceQuery, WorkflowInstanceRecord>
{
  constructor(private readonly facade: WorkflowFacade) {}

  execute(query: GetWorkflowInstanceQuery): Promise<WorkflowInstanceRecord> {
    return this.facade.getInstance(query.instanceId);
  }
}
