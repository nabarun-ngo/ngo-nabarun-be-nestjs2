import { Prisma } from '../prisma/client';
import { Earning } from '../../../internal/finance/domain/aggregates/earning/earning.aggregate';
import { EarningCategory, EarningStatus } from '../../../internal/finance/domain/enums/earning.enum';
import { MapperUtils } from './mapper-utils';
import { toFinanceUserRef } from './finance-user-mapper';
import { EarningPersistence } from './earning.prisma-repository';

export class EarningPrismaMapper {
  static toEarningDomain(p: EarningPersistence | null): Earning | null {
    if (!p) return null;

    return new Earning(
      p.id,
      p.category as EarningCategory,
      Number(p.amount),
      p.currency,
      p.status as EarningStatus,
      p.description,
      p.source,
      MapperUtils.nullToUndefined(p.referenceId),
      MapperUtils.nullToUndefined(p.referenceType),
      MapperUtils.nullToUndefined(p.accountId),
      MapperUtils.nullToUndefined(p.transactionId),
      MapperUtils.nullToUndefined(p.earningDate),
      toFinanceUserRef(p.createdBy) ?? { id: '' },
      toFinanceUserRef(p.receivedBy),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toEarningCreatePersistence(domain: Earning): Prisma.EarningUncheckedCreateInput {
    return {
      id: domain.id,
      category: domain.category,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      description: domain.description,
      source: domain.source,
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      accountId: domain.accountId ?? null,
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      earningDate: MapperUtils.undefinedToNull(domain.earningDate),
      createdById: domain.createdBy?.id ?? null,
      receivedById: domain.receivedBy?.id ?? null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toEarningUpdatePersistence(domain: Earning): Prisma.EarningUncheckedUpdateInput {
    return {
      status: domain.status,
      category: domain.category,
      accountId: domain.accountId ?? null,
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      amount: domain.amount,
      currency: domain.currency,
      description: domain.description,
      source: domain.source,
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      earningDate: MapperUtils.undefinedToNull(domain.earningDate),
      receivedById: domain.receivedBy?.id ?? null,
      updatedAt: domain.updatedAt,
    };
  }
}
