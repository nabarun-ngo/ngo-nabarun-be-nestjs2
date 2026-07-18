import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { Prisma, PrismaClient } from '../prisma/client';
import { Account } from '../../../modules/finance/domain/aggregates/account/account.aggregate';
import { AccountFilter, IAccountRepository } from '../../../modules/finance/domain/repositories/account.repository';
import { AccountPrismaMapper } from './account-prisma.mapper';
import { TransactionPrismaMapper } from './transaction-prisma.mapper';

export type OnlyAccount = Prisma.AccountGetPayload<{
  include: {
    accountHolder: true;
  }
}>;

export type AccountWithTransactions = Prisma.AccountGetPayload<{
  include: {
    accountHolder: true;
    transactions: true;
  }
}>;

@Injectable()
export class AccountPrismaRepository implements IAccountRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: AccountFilter): Promise<number> {
    const where = this.whereQuery(filter);
    return await this.database.client.account.count({ where });
  }

  async findPaged(filter?: BaseFilter<AccountFilter>): Promise<Page<Account>> {
    const where = this.whereQuery(filter?.props!);

    const [data, total] = await Promise.all([
      this.database.client.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          accountHolder: true,
          transactions: filter?.props?.includeBalance ? true : false
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.database.client.account.count({ where }),
    ]);

    return new Page<Account>(
      data.map(m => AccountPrismaMapper.toAccountDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: AccountFilter): Promise<Account[]> {
    const accounts = await this.database.client.account.findMany({
      where: this.whereQuery(filter),
      orderBy: { createdAt: 'desc' },
      include: {
        accountHolder: true,
        transactions: filter?.includeBalance ? true : false
      },
    });

    return accounts.map(m => AccountPrismaMapper.toAccountDomain(m)!);
  }

  private whereQuery(props?: AccountFilter): Prisma.AccountWhereInput {
    const where: Prisma.AccountWhereInput = {
      ...(props?.type && props.type.length > 0 ? { type: { in: [...props.type] } } : {}),
      ...(props?.status && props.status.length > 0 ? { status: { in: [...props.status] } } : {}),
      ...(props?.accountHolderId ? { accountHolderId: props.accountHolderId } : {}),
      ...(props?.id ? { id: props.id } : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Account | null> {
    const account = await this.database.client.account.findUnique({
      where: { id },
      include: {
        accountHolder: true,
        transactions: true
      },
    });

    return AccountPrismaMapper.toAccountDomain(account!);
  }

  async create(account: Account): Promise<Account> {
    const createData: Prisma.AccountUncheckedCreateInput = {
      ...AccountPrismaMapper.toAccountCreatePersistence(account),
      transactions: {
        create: account.transactions.map(m => {
          const { accountId, ...createData } = TransactionPrismaMapper.toTransactionCreatePersistence(m);
          return createData;
        })
      }
    };

    const created = await this.database.client.account.create({
      data: createData,
      include: {
        accountHolder: true,
        transactions: true
      },
    });

    return AccountPrismaMapper.toAccountDomain(created)!;
  }

  async update(id: string, account: Account): Promise<Account> {
    const updateData: Prisma.AccountUncheckedUpdateInput = {
      ...AccountPrismaMapper.toAccountUpdatePersistence(account),
      transactions: {
        upsert: account.transactions.map(m => {
          const { accountId, ...createData } = TransactionPrismaMapper.toTransactionCreatePersistence(m);
          return {
            where: { id: m.id },
            create: { ...createData, transactionRef: m.transactionRef },
            update: TransactionPrismaMapper.toTransactionUpdatePersistence(m)
          };
        })
      }
    };



    const updated = await this.database.client.account.update({
      where: { id },
      data: updateData,
      include: {
        accountHolder: true,
        transactions: true
      },
    });

    return AccountPrismaMapper.toAccountDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.account.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

