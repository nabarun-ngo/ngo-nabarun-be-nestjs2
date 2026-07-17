import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetMyInboxQuery } from './get-my-inbox.query';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowInboxTaskRecord } from '../../../domain/ports/workflow-inbox.repository';

@QueryHandler(GetMyInboxQuery)
@Injectable()
export class GetMyInboxHandler implements IQueryHandler<GetMyInboxQuery, WorkflowInboxTaskRecord[]> {
  constructor(private readonly facade: WorkflowFacade) {}

  execute(query: GetMyInboxQuery): Promise<WorkflowInboxTaskRecord[]> {
    return this.facade.getMyInbox(query.userId);
  }
}
