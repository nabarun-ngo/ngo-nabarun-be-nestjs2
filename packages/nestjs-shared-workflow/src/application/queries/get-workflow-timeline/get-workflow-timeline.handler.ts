import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetWorkflowTimelineQuery } from './get-workflow-timeline.query';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowEventLogEntry } from '../../../domain/ports/workflow-event-log.repository';

@QueryHandler(GetWorkflowTimelineQuery)
@Injectable()
export class GetWorkflowTimelineHandler
  implements IQueryHandler<GetWorkflowTimelineQuery, WorkflowEventLogEntry[]>
{
  constructor(private readonly facade: WorkflowFacade) {}

  execute(query: GetWorkflowTimelineQuery): Promise<WorkflowEventLogEntry[]> {
    return this.facade.getTimeline(query.instanceId, query.options);
  }
}
