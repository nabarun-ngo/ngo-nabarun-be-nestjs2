import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { Earning } from '../../../domain/aggregates/earning/earning.aggregate';
import { EarningStatus } from '../../../domain/enums/earning.enum';
import { TransactionRefType, TransactionType } from '../../../domain/enums/transaction.enum';
import { IEarningRepository } from '../../../domain/repositories/earning.repository';
import { CreateTransactionCommand } from '../create-transaction/create-transaction.command';
import { UpdateEarningCommand } from './update-earning.command';

@CommandHandler(UpdateEarningCommand)
@Injectable()
export class UpdateEarningHandler implements ICommandHandler<UpdateEarningCommand, Earning> {
  constructor(
    @Inject(IEarningRepository) private readonly earningRepository: IEarningRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ params: request }: UpdateEarningCommand): Promise<Earning> {
    const earning = await this.earningRepository.findById(request.id);
    if (!earning) throw new BusinessException('Earning not found with id: ' + request.id);

    earning.update({
      amount: request.amount,
      category: request.category,
      description: request.description,
      earningDate: request.earningDate,
      source: request.source,
    });

    if (request.status === EarningStatus.RECEIVED) {
      if (!request.accountId) throw new BusinessException('Account ID is required to mark earning as received');
      if (!request.earningDate) throw new BusinessException('Earning Date is required to mark earning as received');
      earning.markAsReceived(request.accountId, request.earningDate, request.userId);
      const txnRef = await this.commandBus.execute(
        new CreateTransactionCommand({
          txnAmount: earning.amount,
          currency: earning.currency,
          txnDescription: `Earning - ${earning.category} - ${earning.description}`,
          txnRefId: earning.id,
          txnRefType: TransactionRefType.EARNING,
          accountId: request.accountId,
          txnDate: earning.earningDate,
          txnType: TransactionType.IN,
        }),
      );
      earning.setTransactionId(txnRef);
    }
    if (request.status === EarningStatus.CANCELLED) earning.cancel();

    return this.earningRepository.update(request.id, earning);
  }
}

