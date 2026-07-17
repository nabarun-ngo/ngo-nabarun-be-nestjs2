import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Earning } from '../../../domain/aggregates/earning/earning.aggregate';
import { IEarningRepository } from '../../../domain/repositories/earning.repository';
import { CreateEarningCommand } from './create-earning.command';

@CommandHandler(CreateEarningCommand)
@Injectable()
export class CreateEarningHandler implements ICommandHandler<CreateEarningCommand, Earning> {
  constructor(
    @Inject(IEarningRepository) private readonly earningRepository: IEarningRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ params: request }: CreateEarningCommand): Promise<Earning> {
    const earning = Earning.create({
      category: request.category,
      amount: request.amount,
      currency: request.currency,
      source: request.source,
      description: request.description ?? '',
      createdById: request.userId,
    });
    const saved = await this.earningRepository.create(earning);
    const events = [...earning.domainEvents];
    earning.clearEvents();
    this.eventBus.publishAll(events);
    return saved;
  }
}

