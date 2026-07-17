import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import {
  WorkflowFacade,
  WorkflowTaskHandler,
  WorkflowTaskHandlerContract,
} from '@ce/nestjs-shared-workflow';
import { CreateUserCommand } from '../../user/application/commands/create-user/create-user.command';

@Injectable()
@WorkflowTaskHandler('Auth0UserCreationHandler')
export class Auth0UserCreationHandler implements WorkflowTaskHandlerContract {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly workflowFacade: WorkflowFacade,
  ) {}

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const input = params.input;
    const email = readRequiredString(input, 'email');
    const firstName = readRequiredString(input, 'firstName');
    const lastName = readRequiredString(input, 'lastName');

    const instance = await this.workflowFacade.getInstance(params.instanceId);
    const createdById = instance.initiatedById ?? 'system';

    const user = await this.commandBus.execute(
      new CreateUserCommand({
        email,
        firstName,
        lastName,
        createdById,
      }),
    );

    return {
      auth0Provisioned: true,
      userId: user.id,
      idpSub: user.idpSub ?? null,
    };
  }
}

function readRequiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BusinessException(`Missing or empty required field: ${key}`);
  }
  return value.trim();
}
