import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { StartWorkflowCommand } from './start-workflow.command';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@CommandHandler(StartWorkflowCommand)
@Injectable()
export class StartWorkflowHandler implements ICommandHandler<StartWorkflowCommand, WorkflowInstanceRecord> {
  constructor(private readonly facade: WorkflowFacade) {}

  execute(command: StartWorkflowCommand): Promise<WorkflowInstanceRecord> {
    return this.facade.startWorkflow(command.params);
  }
}
