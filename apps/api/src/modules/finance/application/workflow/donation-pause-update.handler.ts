import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { WorkflowFacade, WorkflowTaskHandler, WorkflowTaskHandlerContract } from '@ce/nestjs-shared-workflow';
import { UpdateUserAdminCommand } from '../../../user/application/commands/update-user-admin/update-user-admin.command';

@Injectable()
@WorkflowTaskHandler('DonationPauseUpdateHandler')
export class DonationPauseUpdateHandler implements WorkflowTaskHandlerContract {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly workflowFacade: WorkflowFacade,
  ) {}

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<void> {
    if (!params.input.startDate || !params.input.endDate) {
      throw new BusinessException('Start date and end date are required');
    }
    const instance = await this.workflowFacade.getInstance(params.instanceId);
    const userId = instance.initiatedForId;
    if (!userId) throw new BusinessException('Workflow instance has no initiatedFor user');

    await this.commandBus.execute(
      new UpdateUserAdminCommand({
        userId,
        adminId: 'system',
        detail: {
          donationPauseStart: new Date(String(params.input.startDate)),
          donationPauseEnd: new Date(String(params.input.endDate)),
        },
      }),
    );
  }
}

