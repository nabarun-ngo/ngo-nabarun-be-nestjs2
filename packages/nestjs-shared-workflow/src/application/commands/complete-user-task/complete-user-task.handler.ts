import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CompleteUserTaskCommand } from './complete-user-task.command';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@CommandHandler(CompleteUserTaskCommand)
@Injectable()
export class CompleteUserTaskHandler
  implements ICommandHandler<CompleteUserTaskCommand, WorkflowInstanceRecord>
{
  constructor(private readonly facade: WorkflowFacade) {}

  execute(command: CompleteUserTaskCommand): Promise<WorkflowInstanceRecord> {
    return this.facade.completeUserTask(command.params);
  }
}
