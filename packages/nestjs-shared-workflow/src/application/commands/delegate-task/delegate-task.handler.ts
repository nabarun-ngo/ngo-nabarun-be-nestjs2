import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DelegateTaskCommand } from './delegate-task.command';
import { WorkflowFacade } from '../../services/workflow.facade';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@CommandHandler(DelegateTaskCommand)
@Injectable()
export class DelegateTaskHandler implements ICommandHandler<DelegateTaskCommand, WorkflowInstanceRecord> {
  constructor(private readonly facade: WorkflowFacade) {}

  execute(command: DelegateTaskCommand): Promise<WorkflowInstanceRecord> {
    return this.facade.delegateTask(command.params);
  }
}
