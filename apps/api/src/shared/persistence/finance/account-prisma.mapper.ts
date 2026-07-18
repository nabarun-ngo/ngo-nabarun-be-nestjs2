import { Prisma } from '../prisma/client';
import { Account } from '../../../modules/finance/domain/aggregates/account/account.aggregate';
import { AccountStatus } from '../../../modules/finance/domain/enums/account-status.enum';
import { AccountType } from '../../../modules/finance/domain/enums/account-type.enum';
import { MapperUtils } from './mapper-utils';
import { TransactionPrismaMapper } from './transaction-prisma.mapper';
import { AccountWithTransactions } from './account.prisma-repository';

export class AccountPrismaMapper {
  static toAccountDomain(p: AccountWithTransactions | null): Account | null {
    if (!p) return null;

    return new Account(
      p.id,
      p.name,
      p.type as AccountType,
      p.currency,
      p.status as AccountStatus,
      MapperUtils.nullToUndefined(p.description),
      p.transactions?.map((t) => TransactionPrismaMapper.toTransactionDomain(t as any)!) ?? [],
      p.accountHolder
        ? `${p.accountHolder.firstName ?? ''} ${p.accountHolder.lastName ?? ''}`.trim()
        : undefined,
      MapperUtils.nullToUndefined(p.accountHolderId),
      MapperUtils.nullToUndefined(p.activatedOn),
      p.bankDetail ? JSON.parse(p.bankDetail) : undefined,
      p.upiDetail ? JSON.parse(p.upiDetail) : undefined,
      p.createdAt,
      p.updatedAt,
    );
  }

  static toAccountCreatePersistence(domain: Account): Prisma.AccountUncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      currency: domain.currency,
      status: domain.status,
      balance: 0,
      description: MapperUtils.undefinedToNull(domain.description),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      bankDetail: domain.bankDetail ? JSON.stringify(domain.bankDetail) : null,
      upiDetail: domain.upiDetail ? JSON.stringify(domain.upiDetail) : null,
      accountHolderId: domain.accountHolderId ?? null,
      activatedOn: domain.activatedOn ?? null,
    };
  }

  static toAccountUpdatePersistence(domain: Account): Prisma.AccountUncheckedUpdateInput {
    return {
      name: domain.name,
      status: domain.status,
      description: MapperUtils.undefinedToNull(domain.description),
      updatedAt: new Date(),
      bankDetail: domain.bankDetail ? JSON.stringify(domain.bankDetail) : null,
      upiDetail: domain.upiDetail ? JSON.stringify(domain.upiDetail) : null,
      activatedOn: domain.activatedOn ?? null,
      currency: domain.currency,
      type: domain.type,
    };
  }
}
