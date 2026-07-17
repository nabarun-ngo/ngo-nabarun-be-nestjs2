import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import {
  WorkflowFacade,
  WorkflowTaskHandler,
  WorkflowTaskHandlerContract,
} from '@ce/nestjs-shared-workflow';
import { PrismaClient } from '../../../shared/persistence/prisma/client';
import { DeleteUserCommand } from '../../user/application/commands/delete-user/delete-user.command';

@Injectable()
@WorkflowTaskHandler('UserDeleteAndDataCleanupHandler')
export class UserDeleteAndDataCleanupHandler implements WorkflowTaskHandlerContract {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly workflowFacade: WorkflowFacade,
    private readonly prisma: BasePrismaService<PrismaClient>,
  ) {}

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const instance = await this.workflowFacade.getInstance(params.instanceId);
    const userId =
      instance.initiatedForId ?? (await this.resolveUserIdFromContext(params.input));

    if (!userId) {
      throw new BusinessException(
        'Cannot delete user: workflow instance has no initiatedFor user and email lookup failed.',
      );
    }

    const adminId = instance.initiatedById ?? 'system';
    await this.commandBus.execute(new DeleteUserCommand({ userId, adminId }));

    return { userDeleted: true, deletedUserId: userId };
  }

  private async resolveUserIdFromContext(
    input: Record<string, unknown>,
  ): Promise<string | null> {
    const email = typeof input.email === 'string' ? input.email.trim() : '';
    if (!email) {
      return null;
    }

    const profile = await this.prisma.userProfile.findFirst({
      where: { email },
      select: { id: true },
    });

    return profile?.id ?? null;
  }
}
