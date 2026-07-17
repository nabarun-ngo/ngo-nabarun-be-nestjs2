import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ForceSkipElementCommand } from './force-skip-element.command';
import { WorkflowOrchestratorService } from '../../services/workflow-orchestrator.service';
import type { WorkflowInstanceRecord } from '../../../domain/ports/workflow-instance.repository';

@CommandHandler(ForceSkipElementCommand)
@Injectable()
export class ForceSkipElementHandler
  implements ICommandHandler<ForceSkipElementCommand, WorkflowInstanceRecord>
{
  constructor(private readonly orchestrator: WorkflowOrchestratorService) {}

  execute(command: ForceSkipElementCommand): Promise<WorkflowInstanceRecord> {
    return this.orchestrator.forceSkipElement(command.params);
  }
}
