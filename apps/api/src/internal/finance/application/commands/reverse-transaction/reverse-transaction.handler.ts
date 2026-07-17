import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { LockingService } from '@ce/nestjs-shared-persistence';
import { TransactionRefType, TransactionStatus, TransactionType } from '../../../domain/enums/transaction.enum';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { ITransactionRepository } from '../../../domain/repositories/transaction.repository';
import { DmsFacade } from '../../../infrastructure/adapters/dms.facade';
import { ReverseTransactionCommand } from './reverse-transaction.command';

@CommandHandler(ReverseTransactionCommand)
@Injectable()
export class ReverseTransactionHandler implements ICommandHandler<ReverseTransactionCommand, void> {
  constructor(
    @Inject(ITransactionRepository) private readonly transactionRepository: ITransactionRepository,
    @Inject(IAccountRepository) private readonly accountRepository: IAccountRepository,
    private readonly eventBus: EventBus,
    private readonly lockingService: LockingService,
    private readonly dmsFacade: DmsFacade,
  ) {}

  async execute({ params: request }: ReverseTransactionCommand): Promise<void> {
    if (!request.transactionRef || !request.reason) {
      throw new BusinessException('Transaction Ref Id and Reason are required');
    }
    const transactions = await this.transactionRepository.findAll({
      transactionRef: request.transactionRef,
      status: [TransactionStatus.SUCCESS],
    });
    if (!transactions.length) {
      throw new BusinessException('Transactions not found with Ref Id: ' + request.transactionRef);
    }
    const lockKeys = transactions.filter((t) => t.accountId).map((t) => t.accountId!);

    await this.lockingService.withLocks(lockKeys, async () => {
      for (const transaction of transactions) {
        if (!transaction.accountId) continue;
        const account = await this.accountRepository.findById(transaction.accountId);
        if (!account) throw new BusinessException('Account not found with id: ' + transaction.accountId);

        const reverseDate = new Date(transaction.transactionDate.getTime() + 60 * 60 * 1000);
        if (transaction.type === TransactionType.IN) {
          account.debit(transaction.amount, {
            transactionRef: transaction.transactionRef,
            description: `Reversed transaction ${transaction.id} due to ${request.reason}`,
            txnDate: reverseDate,
            referenceId: transaction.id,
            referenceType: TransactionRefType.TXN_REVERSE,
            refAccountId: transaction.refAccountId,
          });
        } else if (transaction.type === TransactionType.OUT) {
          account.credit(transaction.amount, {
            transactionRef: transaction.transactionRef,
            description: `Reversed transaction ${transaction.id} due to ${request.reason}`,
            txnDate: reverseDate,
            referenceId: transaction.id,
            referenceType: TransactionRefType.TXN_REVERSE,
            refAccountId: transaction.refAccountId,
          });
        }
        account.transactions.find((t) => t.id === transaction.id)?.reverse();
        await this.accountRepository.update(account.id, account);
        const events = [...account.domainEvents];
        account.clearEvents();
        this.eventBus.publishAll(events);

        for (const doc of await this.dmsFacade.getDocuments('transaction', transaction.id)) {
          await this.dmsFacade.deleteFile(doc.id);
        }
      }
    });
  }
}

