import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException, generateUniqueNDigitNumber } from '@ce/nestjs-shared-core';
import { LockingService } from '@ce/nestjs-shared-persistence';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { TransactionRefType } from '../../../domain/enums/transaction.enum';
import { CreateTransactionCommand } from './create-transaction.command';

@CommandHandler(CreateTransactionCommand)
@Injectable()
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand, string> {
  constructor(
    @Inject(IAccountRepository) private readonly accountRepository: IAccountRepository,
    private readonly eventBus: EventBus,
    private readonly lockingService: LockingService,
  ) {}

  async execute({ params: request }: CreateTransactionCommand): Promise<string> {
    if (request.actorUserId) {
      const account = await this.accountRepository.findById(request.accountId);
      if (!account) {
        throw new BusinessException('Account not found with id ' + request.accountId);
      }
      if (account.accountHolderId !== request.actorUserId) {
        throw new BusinessException('Account does not belongs to user.');
      }
    }

    const lockKeys = [request.accountId];
    if (request.txnType === 'TRANSFER' && request.transferToAccountId) {
      lockKeys.push(request.transferToAccountId);
    }

    return this.lockingService.withLocks(lockKeys, async () => {
      const transactionRef = `TXR${generateUniqueNDigitNumber(10)}`;
      const refType = request.txnRefType as TransactionRefType | undefined;

      if (request.txnType === 'TRANSFER') {
        if (!request.transferToAccountId) {
          throw new BusinessException('Transfer to account id is required');
        }
        const fromAccount = await this.accountRepository.findById(request.accountId);
        const toAccount = await this.accountRepository.findById(request.transferToAccountId);
        if (!fromAccount) throw new BusinessException('Account not found with id ' + request.accountId);
        if (!toAccount) throw new BusinessException('Account not found with id ' + request.transferToAccountId);

        fromAccount.debit(request.txnAmount, {
          transactionRef,
          description: request.txnDescription,
          txnDate: request.txnDate ?? new Date(),
          referenceId: request.txnRefId,
          referenceType: refType,
          refAccountId: request.transferToAccountId,
        });
        toAccount.credit(request.txnAmount, {
          transactionRef,
          description: request.txnDescription,
          txnDate: request.txnDate ?? new Date(),
          referenceId: request.txnRefId,
          referenceType: refType,
          refAccountId: request.accountId,
        });

        await this.accountRepository.update(fromAccount.id, fromAccount);
        await this.accountRepository.update(toAccount.id, toAccount);
        this.publishEvents(fromAccount, toAccount);
      } else {
        const account = await this.accountRepository.findById(request.accountId);
        if (!account) throw new BusinessException('Account not found with id ' + request.accountId);

        if (request.txnType === 'IN') {
          account.credit(request.txnAmount, {
            transactionRef,
            description: request.txnDescription,
            txnDate: request.txnDate ?? new Date(),
            referenceId: request.txnRefId,
            referenceType: refType,
          });
        } else {
          account.debit(request.txnAmount, {
            transactionRef,
            description: request.txnDescription,
            txnDate: request.txnDate ?? new Date(),
            referenceId: request.txnRefId,
            referenceType: refType,
          });
        }
        await this.accountRepository.update(account.id, account);
        this.publishEvents(account);
      }
      return transactionRef;
    });
  }

  private publishEvents(...accounts: { domainEvents: readonly object[]; clearEvents(): void }[]): void {
    for (const account of accounts) {
      const events = [...account.domainEvents];
      account.clearEvents();
      this.eventBus.publishAll(events as any);
    }
  }
}

