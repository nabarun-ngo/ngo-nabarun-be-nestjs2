import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CancelWorkflowCommand } from './cancel-workflow.command';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@CommandHandler(CancelWorkflowCommand)
@Injectable()
export class CancelWorkflowHandler
  implements ICommandHandler<CancelWorkflowCommand, WorkflowInstanceRecord>
{
  constructor(private readonly facade: WorkflowFacade) {}

  execute(command: CancelWorkflowCommand): Promise<WorkflowInstanceRecord> {
    return this.facade.cancelWorkflow(command.params);
  }
}
