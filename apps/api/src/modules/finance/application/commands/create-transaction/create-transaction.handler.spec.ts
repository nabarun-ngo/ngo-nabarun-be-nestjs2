import { EventBus } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { LockingService } from '@ce/nestjs-shared-persistence';
import { CreateTransactionHandler } from './create-transaction.handler';
import { CreateTransactionCommand } from './create-transaction.command';
import { TransactionRefType } from '../../../domain/enums/transaction.enum';

describe('CreateTransactionHandler', () => {
  const makeAccount = (id: string, balance = 1000) => ({
    id,
    credit: jest.fn(),
    debit: jest.fn(),
    domainEvents: [],
    clearEvents: jest.fn(),
    hasSufficientFunds: jest.fn().mockReturnValue(balance >= 100),
  });

  it('credits account on IN transaction', async () => {
    const account = makeAccount('ACC1');
    const accountRepository = {
      findById: jest.fn().mockResolvedValue(account),
      update: jest.fn().mockResolvedValue(account),
    };
    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;
    const lockingService = {
      withLocks: jest.fn((_keys: string[], fn: () => Promise<string>) => fn()),
    } as unknown as LockingService;

    const handler = new CreateTransactionHandler(accountRepository as any, eventBus, lockingService);
    const ref = await handler.execute(
      new CreateTransactionCommand({
        txnType: 'IN',
        txnAmount: 100,
        currency: 'INR',
        accountId: 'ACC1',
        txnDescription: 'Test credit',
        txnRefType: TransactionRefType.NONE,
      }),
    );

    expect(ref).toMatch(/^TXR\d+$/);
    expect(account.credit).toHaveBeenCalled();
    expect(accountRepository.update).toHaveBeenCalledWith('ACC1', account);
  });

  it('throws when account not found', async () => {
    const handler = new CreateTransactionHandler(
      { findById: jest.fn().mockResolvedValue(null) } as any,
      { publishAll: jest.fn() } as any,
      { withLocks: jest.fn((_k: string[], fn: () => Promise<unknown>) => fn()) } as any,
    );

    await expect(
      handler.execute(
        new CreateTransactionCommand({
          txnType: 'IN',
          txnAmount: 10,
          currency: 'INR',
          accountId: 'MISSING',
          txnDescription: 'x',
        }),
      ),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('throws when actor does not own account on self transfer', async () => {
    const account = { id: 'ACC1', accountHolderId: 'USER_A' };
    const handler = new CreateTransactionHandler(
      { findById: jest.fn().mockResolvedValue(account) } as any,
      { publishAll: jest.fn() } as any,
      { withLocks: jest.fn((_k: string[], fn: () => Promise<unknown>) => fn()) } as any,
    );

    await expect(
      handler.execute(
        new CreateTransactionCommand({
          txnType: 'TRANSFER',
          txnAmount: 10,
          currency: 'INR',
          accountId: 'ACC1',
          transferToAccountId: 'ACC2',
          txnDescription: 'x',
          actorUserId: 'USER_B',
        }),
      ),
    ).rejects.toBeInstanceOf(BusinessException);
  });
});
