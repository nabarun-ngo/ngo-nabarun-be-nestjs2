import { Prisma } from '../prisma/client';
import { Transaction } from '../../../internal/finance/domain/entities/transaction.entity';
import { TransactionRefType, TransactionStatus, TransactionType } from '../../../internal/finance/domain/enums/transaction.enum';
import { MapperUtils } from './mapper-utils';

export type TransactionRow = {
  id: string;
  transactionRef: string;
  type: string;
  amount: unknown;
  currency: string;
  status: string;
  referenceId: string | null;
  referenceType: string | null;
  description: string;
  metadata: unknown;
  transactionDate: Date;
  particulars: string | null;
  accountId: string | null;
  refAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
  balanceAfter?: unknown;
};

export class TransactionPrismaMapper {
  static toTransactionDomain(p: TransactionRow | null): Transaction | null {
    if (!p) return null;

    return new Transaction(
      p.id,
      p.transactionRef,
      p.type as TransactionType,
      Number(p.amount),
      p.currency,
      p.status as TransactionStatus,
      MapperUtils.nullToUndefined(p.referenceId),
      MapperUtils.nullToUndefined(p.referenceType as TransactionRefType),
      p.description,
      MapperUtils.nullToUndefined(p.metadata) as Record<string, unknown> | undefined,
      p.transactionDate,
      MapperUtils.nullToUndefined(p.particulars),
      MapperUtils.nullToUndefined(p.accountId),
      MapperUtils.nullToUndefined(p.refAccountId),
      p.createdAt,
      p.updatedAt,
      p.balanceAfter !== undefined ? Number(p.balanceAfter) : undefined,
    );
  }

  static toTransactionCreatePersistence(domain: Transaction): Prisma.TransactionUncheckedCreateInput {
    return {
      id: domain.id,
      transactionRef: domain.transactionRef,
      type: domain.type,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      accountId: domain.accountId ?? null,
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      description: domain.description,
      metadata: domain.metadata ?? Prisma.JsonNull,
      transactionDate: domain.transactionDate,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      particulars: domain.particulars ?? null,
      refAccountId: domain.refAccountId ?? null,
    };
  }

  static toTransactionUpdatePersistence(domain: Transaction): Prisma.TransactionUncheckedUpdateInput {
    return {
      status: domain.status,
      updatedAt: domain.updatedAt ?? new Date(),
    };
  }
}
