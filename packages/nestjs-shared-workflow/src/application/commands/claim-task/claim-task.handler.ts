import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ClaimTaskCommand } from './claim-task.command';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@CommandHandler(ClaimTaskCommand)
@Injectable()
export class ClaimTaskHandler implements ICommandHandler<ClaimTaskCommand, WorkflowInstanceRecord> {
  constructor(private readonly facade: WorkflowFacade) {}

  execute(command: ClaimTaskCommand): Promise<WorkflowInstanceRecord> {
    return this.facade.claimTask(command.params);
  }
}
