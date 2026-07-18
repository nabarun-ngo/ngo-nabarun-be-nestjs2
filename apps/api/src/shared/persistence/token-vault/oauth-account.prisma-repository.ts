import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@nabarun-ngo/nestjs-shared-persistence';
import type { PrismaClient } from '../prisma/client';
import type {
  TokenVault2OAuthAccountWhereInput,
  TokenVault2OAuthAccountWhereUniqueInput,
  TokenVault2OAuthAccountCreateInput,
  TokenVault2OAuthAccountUncheckedCreateInput,
  TokenVault2OAuthAccountUpdateInput,
  TokenVault2OAuthAccountUncheckedUpdateInput,
  TokenVault2OAuthAccountOrderByWithRelationInput,
} from '../prisma/models';
import {
  OAuthAccount,
  OAuthAccountFilter,
  IOAuthAccountRepository,
} from '@nabarun-ngo/nestjs-shared-token-vault';

type AccountRow = {
  id: string;
  provider: string;
  email: string;
  externalId: string | null;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  pictureUrl: string | null;
  locale: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class OAuthAccountPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'tokenVault2OAuthAccount',
    OAuthAccount,
    string,
    OAuthAccountFilter,
    AccountRow,
    TokenVault2OAuthAccountWhereInput,
    TokenVault2OAuthAccountWhereUniqueInput,
    ({} & TokenVault2OAuthAccountUncheckedCreateInput) | ({} & TokenVault2OAuthAccountCreateInput),
    ({} & TokenVault2OAuthAccountUncheckedUpdateInput) | ({} & TokenVault2OAuthAccountUpdateInput),
    TokenVault2OAuthAccountOrderByWithRelationInput
  >
  implements IOAuthAccountRepository {
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'tokenVault2OAuthAccount');
  }

  async findByProviderAndEmail(provider: string, email: string): Promise<OAuthAccount | null> {
    // HIGH-6: findUnique cannot carry extra conditions (like deletedAt: null) on a
    // composite unique key in Prisma, so we use findFirst with an explicit soft-delete
    // guard to prevent returning logically-deleted accounts.
    const row = await (this.delegate).findFirst({
      where: { provider, email, deletedAt: null },
    });
    return row ? this.toDomain(row as AccountRow) : null;
  }

  protected toDomain(row: AccountRow): OAuthAccount {
    return OAuthAccount.rehydrate({
      id: row.id,
      provider: row.provider,
      email: row.email,
      externalId: row.externalId ?? undefined,
      name: row.name ?? undefined,
      givenName: row.givenName ?? undefined,
      familyName: row.familyName ?? undefined,
      pictureUrl: row.pictureUrl ?? undefined,
      locale: row.locale ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  protected toCreateInput(
    entity: OAuthAccount,
  ): ({} & TokenVault2OAuthAccountUncheckedCreateInput) | ({} & TokenVault2OAuthAccountCreateInput) {
    return {
      id: entity.id,
      provider: entity.provider,
      email: entity.email,
      externalId: entity.externalId ?? null,
      name: entity.name ?? null,
      givenName: entity.givenName ?? null,
      familyName: entity.familyName ?? null,
      pictureUrl: entity.pictureUrl ?? null,
      locale: entity.locale ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUpdateInput(
    _id: string,
    entity: OAuthAccount,
  ): ({} & TokenVault2OAuthAccountUncheckedUpdateInput) | ({} & TokenVault2OAuthAccountUpdateInput) {
    return {
      email: entity.email,
      externalId: entity.externalId ?? null,
      name: entity.name ?? null,
      givenName: entity.givenName ?? null,
      familyName: entity.familyName ?? null,
      pictureUrl: entity.pictureUrl ?? null,
      locale: entity.locale ?? null,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): TokenVault2OAuthAccountWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: OAuthAccountFilter): TokenVault2OAuthAccountWhereInput {
    return {
      ...(filter?.provider ? { provider: filter.provider } : {}),
      ...(filter?.email ? { email: filter.email } : {}),
    };
  }

  protected defaultOrderBy(): TokenVault2OAuthAccountOrderByWithRelationInput {
    return { createdAt: 'desc' };
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }
}
