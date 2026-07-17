import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { UserDeletedEvent } from '../../user/domain/events/user-deleted.event';
import { PrismaClient } from '../../../shared/persistence/prisma/client';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class OnUserDeletedWorkflowHandler implements IEventHandler<UserDeletedEvent> {
  private readonly logger = new Logger(OnUserDeletedWorkflowHandler.name);

  constructor(private readonly prisma: BasePrismaService<PrismaClient>) {}

  async handle(event: UserDeletedEvent): Promise<void> {
    const result = await this.prisma.workflowTaskInbox.updateMany({
      where: {
        assignedToId: event.userId,
        status: { in: ['PENDING', 'CLAIMED'] },
      },
      data: {
        assignedToId: null,
        claimedById: null,
        claimedAt: null,
        status: 'PENDING',
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Released ${result.count} workflow inbox task(s) after user delete: ${event.userId}`,
      );
    }
  }
}
