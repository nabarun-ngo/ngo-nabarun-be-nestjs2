import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { WorkflowFacade, WorkflowTaskHandler, WorkflowTaskHandlerContract } from '@ce/nestjs-shared-workflow';
import { UpdateUserAdminCommand } from '../../../user/application/commands/update-user-admin/update-user-admin.command';

@Injectable()
@WorkflowTaskHandler('DonationAmountUpdateHandler')
export class DonationAmountUpdateHandler implements WorkflowTaskHandlerContract {
  private readonly logger = new Logger(DonationAmountUpdateHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly workflowFacade: WorkflowFacade,
  ) {}

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<void> {
    const newAmount = params.input.newAmount;
    if (newAmount == null) throw new BusinessException('Donation amount is required');

    const instance = await this.workflowFacade.getInstance(params.instanceId);
    const userId = instance.initiatedForId;
    if (!userId) throw new BusinessException('Workflow instance has no initiatedFor user');

    await this.commandBus.execute(
      new UpdateUserAdminCommand({
        userId,
        adminId: 'system',
        detail: { donationAmount: Number(newAmount) },
      }),
    );
    this.logger.log('Donation amount updated for user ' + userId);
  }
}

