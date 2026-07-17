import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { PublishDefinitionCommand } from './publish-definition.command';
import { WORKFLOW_DEFINITION_PORT, IWorkflowDefinitionPort } from '../../../domain/ports/workflow-definition.port';
import type { WorkflowDefinition } from '../../../dsl/workflow-definition.schema';

@CommandHandler(PublishDefinitionCommand)
@Injectable()
export class PublishDefinitionHandler
  implements ICommandHandler<PublishDefinitionCommand, WorkflowDefinition>
{
  constructor(
    @Inject(WORKFLOW_DEFINITION_PORT)
    private readonly definitionPort: IWorkflowDefinitionPort,
  ) {}

  execute(command: PublishDefinitionCommand): Promise<WorkflowDefinition> {
    return this.definitionPort.publishDefinition(command.definition);
  }
}
