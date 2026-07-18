import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { Prisma, PrismaClient } from '../prisma/client';
import { ITransactionRepository, TransactionFilter } from '../../../modules/finance/domain/repositories/transaction.repository';
import { Transaction } from '../../../modules/finance/domain/entities/transaction.entity';
import { TransactionPrismaMapper } from './transaction-prisma.mapper';

export type TransactionPersistence = Prisma.TransactionGetPayload<{
  include: {};
}>;

@Injectable()
export class TransactionPrismaRepository implements ITransactionRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: TransactionFilter): Promise<number> {
    const where = this.whereQuery(filter);
    return await this.database.client.transaction.count({ where });
  }

  async findPaged(filter?: BaseFilter<TransactionFilter>): Promise<Page<Transaction>> {
    const limit = filter?.pageSize ?? 1000;
    const offset = (filter?.pageIndex ?? 0) * limit;

    const accountCteFilter = filter?.props?.accountIds && filter.props.accountIds.length > 0
      ? Prisma.sql`AND "accountId" IN (${Prisma.join(filter.props.accountIds)})`
      : Prisma.empty;

    const conditions = this.getRawConditions(filter?.props);
    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const data = await this.database.client.$queryRaw<any[]>`
      WITH balance_cte AS (
        SELECT 
          id,
          SUM(CASE WHEN type = 'IN' THEN amount ELSE -amount END) 
          OVER (PARTITION BY "accountId" ORDER BY "transactionDate" ASC, id ASC) as "balanceAfter"
        FROM transactions
        WHERE "deletedAt" IS NULL
        ${accountCteFilter}
      )
      SELECT t.*, b."balanceAfter", COUNT(*) OVER() as "totalCount"
      FROM transactions t
      JOIN balance_cte b ON t.id = b.id
      ${whereClause}
      ORDER BY t."transactionDate" DESC, t.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = data.length > 0 ? Number(data[0].totalCount) : 0;

    return new Page<Transaction>(
      data.map(m => TransactionPrismaMapper.toTransactionDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: TransactionFilter): Promise<Transaction[]> {
    const accountCteFilter = filter?.accountIds && filter.accountIds.length > 0
      ? Prisma.sql`AND "accountId" IN (${Prisma.join(filter.accountIds)})`
      : Prisma.empty;

    const conditions = this.getRawConditions(filter);
    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const data = await this.database.client.$queryRaw<any[]>`
      WITH balance_cte AS (
        SELECT 
          id,
          SUM(CASE WHEN type = 'IN' THEN amount ELSE -amount END) 
          OVER (PARTITION BY "accountId" ORDER BY "transactionDate" ASC, id ASC) as "balanceAfter"
        FROM transactions
        WHERE "deletedAt" IS NULL
        ${accountCteFilter}
      )
      SELECT t.*, b."balanceAfter"
      FROM transactions t
      JOIN balance_cte b ON t.id = b.id
      ${whereClause}
      ORDER BY t."transactionDate" DESC, t.id DESC
    `;

    return data.map(m => TransactionPrismaMapper.toTransactionDomain(m)!);
  }

  private getRawConditions(props?: TransactionFilter): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [Prisma.sql`t."deletedAt" IS NULL`];
    if (props?.id) conditions.push(Prisma.sql`t.id = ${props.id}`);
    if (props?.type && props.type.length > 0) conditions.push(Prisma.sql`t.type IN (${Prisma.join(props.type)})`);
    if (props?.status && props.status.length > 0) conditions.push(Prisma.sql`t.status IN (${Prisma.join(props.status)})`);
    if (props?.accountIds && props.accountIds.length > 0) conditions.push(Prisma.sql`t."accountId" IN (${Prisma.join(props.accountIds)})`);
    if (props?.referenceType && props.referenceType.length > 0) conditions.push(Prisma.sql`t."referenceType" IN (${Prisma.join(props.referenceType)})`);
    if (props?.referenceId) conditions.push(Prisma.sql`t."referenceId" = ${props.referenceId}`);
    if (props?.transactionRef) conditions.push(Prisma.sql`t."transactionRef" = ${props.transactionRef}`);
    if (props?.startDate) conditions.push(Prisma.sql`t."transactionDate" >= ${props.startDate}`);
    if (props?.endDate) conditions.push(Prisma.sql`t."transactionDate" <= ${props.endDate}`);
    return conditions;
  }

  private whereQuery(props?: TransactionFilter): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      ...(props?.id ? { id: props.id } : {}),
      ...(props?.type ? { type: { in: props.type } } : {}),
      ...(props?.status ? { status: { in: props.status } } : {}),
      ...(props?.accountIds ? { accountId: { in: props.accountIds } } : {}),
      ...(props?.referenceType ? { referenceType: { in: props.referenceType } } : {}),
      ...(props?.referenceId ? { referenceId: props.referenceId } : {}),
      ...(props?.transactionRef ? { transactionRef: props.transactionRef } : {}),
      ...(props?.startDate || props?.endDate
        ? {
          transactionDate: {
            ...(props.startDate ? { gte: props.startDate } : {}),
            ...(props.endDate ? { lte: props.endDate } : {}),
          },
        }
        : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.database.client.transaction.findUnique({
      where: { id },
      include: {
      },
    });

    return TransactionPrismaMapper.toTransactionDomain(transaction!);
  }



  async create(transaction: Transaction): Promise<Transaction> {
    const createData: Prisma.TransactionUncheckedCreateInput = {
      ...TransactionPrismaMapper.toTransactionCreatePersistence(transaction),
    };

    const created = await this.database.client.transaction.create({
      data: createData,
      include: {
      },
    });

    return TransactionPrismaMapper.toTransactionDomain(created)!;
  }

  async update(id: string, transaction: Transaction): Promise<Transaction> {
    const updateData: Prisma.TransactionUncheckedUpdateInput = {
      ...TransactionPrismaMapper.toTransactionUpdatePersistence(transaction),
    };

    const updated = await this.database.client.transaction.update({
      where: { id },
      data: updateData,
      include: {
      },
    });

    return TransactionPrismaMapper.toTransactionDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }


}

