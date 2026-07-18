import { CommandBus, EventBus } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { SettleExpenseHandler } from './settle-expense.handler';
import { SettleExpenseCommand } from './settle-expense.command';
import { ExpenseStatus } from '../../../domain/enums/expense.enum';

describe('SettleExpenseHandler', () => {
  it('settles a finalized expense', async () => {
    const expense = {
      id: 'NEX123',
      amount: 200,
      currency: 'INR',
      status: ExpenseStatus.FINALIZED,
      expenseDate: new Date(),
      isPayable: jest.fn().mockReturnValue(true),
      settle: jest.fn(),
      domainEvents: [],
      clearEvents: jest.fn(),
    };

    const expenseRepository = {
      findById: jest.fn().mockResolvedValue(expense),
      update: jest.fn().mockImplementation((_id, e) => e),
    };
    const accountRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'ACC1',
        hasSufficientFunds: jest.fn().mockReturnValue(true),
      }),
    };
    const commandBus = {
      execute: jest.fn().mockResolvedValue('TXR1234567890'),
    } as unknown as CommandBus;
    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;

    const handler = new SettleExpenseHandler(
      expenseRepository as any,
      accountRepository as any,
      commandBus,
      eventBus,
    );

    await handler.execute(
      new SettleExpenseCommand({ id: 'NEX123', accountId: 'ACC1', settledById: 'USR1' }),
    );

    expect(expense.settle).toHaveBeenCalledWith({
      settledBy: { id: 'USR1' },
      accountId: 'ACC1',
      transactionId: 'TXR1234567890',
    });
  });

  it('rejects non-payable expense', async () => {
    const handler = new SettleExpenseHandler(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'NEX1',
          status: ExpenseStatus.DRAFT,
          isPayable: () => false,
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      handler.execute(new SettleExpenseCommand({ id: 'NEX1', accountId: 'A', settledById: 'U' })),
    ).rejects.toBeInstanceOf(BusinessException);
  });
});
