import { Injectable } from '@nestjs/common';
import { BasePrismaService, PrismaCrudRepositoryBase } from '@ce/nestjs-shared-persistence';
import { PrismaClient, Prisma } from '../prisma/client';
import type {
  UserProfileWhereInput,
  UserProfileWhereUniqueInput,
  UserProfileOrderByWithRelationInput,
  UserProfileCreateInput,
  UserProfileUpdateInput,
} from '../prisma/models/UserProfile';
import { User, UserRehydrateProps } from '../../../internal/user/domain/aggregates/user/user.aggregate';
import { IUserRepository, UserFilter } from '../../../internal/user/domain/repositories/user.repository';
import { PhoneNumber } from '../../../internal/user/domain/value-objects/phone-number.vo';
import { Address } from '../../../internal/user/domain/value-objects/address.vo';
import { SocialLink } from '../../../internal/user/domain/entities/social-link.entity';
import { UserStatus } from '../../../internal/user/domain/enums/user-status.enum';

// ── Row types (shape returned by Prisma when children are included) ────────────

type PhoneRow = {
  id: string; userId: string; phoneCode: string; phoneNumber: string;
  hidden: boolean; isPrimary: boolean;
};

type AddressRow = {
  id: string; userId: string; addressType: string;
  addressLine1: string; addressLine2: string | null; addressLine3: string | null;
  hometown: string; zipCode: string; state: string; district: string; country: string;
};

type SocialLinkRow = {
  id: string; userId: string; linkName: string; linkType: string;
  linkValue: string; createdAt: Date; updatedAt: Date;
};

export type UserProfileRow = {
  id: string; email: string; idpSub: string | null;
  title: string | null; firstName: string; middleName: string | null; lastName: string;
  dateOfBirth: Date | null; gender: string | null; about: string | null; picture: string | null;
  status: string; isPublic: boolean; isSameAddress: boolean | null;
  isProfileComplete: boolean;
  donationAmount: Prisma.Decimal | null;
  donationPauseStart: Date | null;
  donationPauseEnd: Date | null;
  version: number;
  createdById: string | null; updatedById: string | null;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
  phoneNumbers?: PhoneRow[];
  addresses?: AddressRow[];
  socialMediaLinks?: SocialLinkRow[];
};

// Always loaded — child rows are required for aggregate reconstitution.
const INCLUDE_CHILDREN = {
  phoneNumbers: true,
  addresses: true,
  socialMediaLinks: true,
} as const;

type UserInclude = typeof INCLUDE_CHILDREN;

@Injectable()
export class UserPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,                       // TClient
    'userProfile',                      // TDelegateKey
    User,                               // TEntity
    string,                             // TId
    UserFilter,                         // TFilter
    UserProfileRow,                     // TRow
    UserProfileWhereInput,              // TWhereInput
    UserProfileWhereUniqueInput,        // TWhereUniqueInput
    UserProfileCreateInput,             // TCreateInput
    UserProfileUpdateInput,             // TUpdateInput
    UserProfileOrderByWithRelationInput,// TOrderBy
    UserInclude                         // TInclude
  >
  implements IUserRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'userProfile');
  }

  // ── Custom find methods ───────────────────────────────────────────────────

  /** Includes soft-deleted rows — needed for create-flow email collision check. */
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.delegate.findFirst({
      where: { email },
      include: INCLUDE_CHILDREN,
    });
    return row ? this.toDomain(row as UserProfileRow) : null;
  }

  /** Active-only by IdP sub — used for JWT enrichment cache miss path. */
  async findByIdPSub(sub: string): Promise<User | null> {
    const row = await this.delegate.findFirst({
      where: { idpSub: sub, deletedAt: null },
      include: INCLUDE_CHILDREN,
    });
    return row ? this.toDomain(row as UserProfileRow) : null;
  }

  /** Batch fetch by app-profile UUIDs — single query, avoids N+1. */
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const rows = await this.delegate.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: INCLUDE_CHILDREN,
    });
    return (rows as UserProfileRow[]).map((r) => this.toDomain(r));
  }

  /** Batch fetch by IdP subjects — single query, avoids N+1. */
  async findByIdPSubs(subs: string[]): Promise<User[]> {
    if (subs.length === 0) return [];
    const rows = await this.delegate.findMany({
      where: { idpSub: { in: subs }, deletedAt: null },
      include: INCLUDE_CHILDREN,
    });
    return (rows as UserProfileRow[]).map((r) => this.toDomain(r));
  }

  // ── Abstract mapping hooks (required by PrismaCrudRepositoryBase) ─────────

  protected toDomain(row: UserProfileRow): User {
    const phones = row.phoneNumbers ?? [];
    const primaryRow = phones.find((p) => p.isPrimary);
    const secondaryRow = phones.find((p) => !p.isPrimary);

    const addresses = row.addresses ?? [];
    const presentRow = addresses.find((a) => a.addressType === 'PRESENT');
    const permanentRow = addresses.find((a) => a.addressType === 'PERMANENT');

    const socialLinks = (row.socialMediaLinks ?? []).map((s) =>
      SocialLink.rehydrate(s.id, s.linkName, s.linkType, s.linkValue, s.createdAt, s.updatedAt),
    );

    const props: UserRehydrateProps = {
      id: row.id,
      email: row.email,
      idpSub: row.idpSub ?? undefined,
      status: row.status as UserStatus,
      firstName: row.firstName,
      lastName: row.lastName,
      isProfileComplete: row.isProfileComplete,
      isPublic: row.isPublic,
      socialMediaLinks: socialLinks,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
      title: row.title ?? undefined,
      middleName: row.middleName ?? undefined,
      dateOfBirth: row.dateOfBirth ?? undefined,
      gender: row.gender ?? undefined,
      about: row.about ?? undefined,
      picture: row.picture ?? undefined,
      isSameAddress: row.isSameAddress ?? undefined,
      createdById: row.createdById ?? undefined,
      updatedById: row.updatedById ?? undefined,
      donationAmount: row.donationAmount != null ? Number(row.donationAmount) : undefined,
      donationPauseStart: row.donationPauseStart ?? undefined,
      donationPauseEnd: row.donationPauseEnd ?? undefined,
      primaryPhone: primaryRow
        ? PhoneNumber.of(primaryRow.phoneCode, primaryRow.phoneNumber, primaryRow.hidden)
        : undefined,
      secondaryPhone: secondaryRow
        ? PhoneNumber.of(secondaryRow.phoneCode, secondaryRow.phoneNumber, secondaryRow.hidden)
        : undefined,
      presentAddress: presentRow
        ? Address.of(presentRow.addressLine1, presentRow.hometown, presentRow.zipCode,
            presentRow.state, presentRow.district, presentRow.country,
            presentRow.addressLine2 ?? undefined, presentRow.addressLine3 ?? undefined)
        : undefined,
      permanentAddress: permanentRow
        ? Address.of(permanentRow.addressLine1, permanentRow.hometown, permanentRow.zipCode,
            permanentRow.state, permanentRow.district, permanentRow.country,
            permanentRow.addressLine2 ?? undefined, permanentRow.addressLine3 ?? undefined)
        : undefined,
    };

    return User.rehydrate(props);
  }

  protected toCreateInput(entity: User): UserProfileCreateInput {
    return {
      id: entity.id,
      email: entity.email,
      idpSub: entity.idpSub ?? null,
      title: entity.title ?? null,
      firstName: entity.firstName,
      middleName: entity.middleName ?? null,
      lastName: entity.lastName,
      dateOfBirth: entity.dateOfBirth ?? null,
      gender: entity.gender ?? null,
      about: entity.about ?? null,
      picture: entity.picture ?? null,
      status: entity.status,
      isPublic: entity.isPublic,
      isSameAddress: entity.isSameAddress ?? null,
      isProfileComplete: entity.isProfileComplete,
      donationAmount: entity.donationAmount ?? null,
      donationPauseStart: entity.donationPauseStart ?? null,
      donationPauseEnd: entity.donationPauseEnd ?? null,
      createdById: entity.createdById ?? null,
      updatedById: entity.updatedById ?? null,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
      phoneNumbers: { create: this.buildPhoneCreateData(entity) },
      addresses: { create: this.buildAddressCreateData(entity) },
      socialMediaLinks: { create: this.buildSocialLinkCreateData(entity) },
    };
  }

  protected toUpdateInput(_id: string, entity: User): UserProfileUpdateInput {
    const phoneData = this.buildPhoneCreateData(entity);
    const addressData = this.buildAddressCreateData(entity);
    const socialData = this.buildSocialLinkCreateData(entity);
    return {
      idpSub: entity.idpSub ?? null,
      title: entity.title ?? null,
      firstName: entity.firstName,
      middleName: entity.middleName ?? null,
      lastName: entity.lastName,
      dateOfBirth: entity.dateOfBirth ?? null,
      gender: entity.gender ?? null,
      about: entity.about ?? null,
      picture: entity.picture ?? null,
      status: entity.status,
      isPublic: entity.isPublic,
      isSameAddress: entity.isSameAddress ?? null,
      isProfileComplete: entity.isProfileComplete,
      donationAmount: entity.donationAmount ?? null,
      donationPauseStart: entity.donationPauseStart ?? null,
      donationPauseEnd: entity.donationPauseEnd ?? null,
      updatedById: entity.updatedById ?? null,
      deletedAt: entity.deletedAt ?? null,
      version: { increment: 1 },
      updatedAt: new Date(),
      phoneNumbers: {
        deleteMany: {},
        ...(phoneData.length > 0 ? { createMany: { data: phoneData } } : {}),
      },
      addresses: {
        deleteMany: {},
        ...(addressData.length > 0 ? { createMany: { data: addressData } } : {}),
      },
      socialMediaLinks: {
        deleteMany: {},
        ...(socialData.length > 0 ? { createMany: { data: socialData } } : {}),
      },
    };
  }

  protected toUniqueWhere(id: string): UserProfileWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: UserFilter): UserProfileWhereInput {
    const where: UserProfileWhereInput = {};
    if (filter?.email) where.email = { contains: filter.email, mode: 'insensitive' };
    if (filter?.status) where.status = filter.status;
    if (filter?.isPublic !== undefined) where.isPublic = filter.isPublic;
    if (filter?.firstName) where.firstName = { contains: filter.firstName, mode: 'insensitive' };
    if (filter?.lastName) where.lastName = { contains: filter.lastName, mode: 'insensitive' };
    if (filter?.phoneNumber) {
      where.phoneNumbers = { some: { phoneNumber: { contains: filter.phoneNumber } } };
    }
    return where;
  }

  // ── Behavioural hooks ─────────────────────────────────────────────────────

  protected override supportsSoftDelete(): boolean {
    return true;
  }

  protected override defaultOrderBy(): UserProfileOrderByWithRelationInput {
    return { createdAt: 'desc' };
  }

  /** Always eager-load child rows so aggregates can be fully reconstituted. */
  protected override toInclude(): UserInclude {
    return INCLUDE_CHILDREN;
  }

  // ── Child-row helpers ─────────────────────────────────────────────────────

  private buildPhoneCreateData(entity: User): any[] {
    const rows: any[] = [];
    if (entity.primaryPhone) {
      rows.push({
        phoneCode: entity.primaryPhone.phoneCode,
        phoneNumber: entity.primaryPhone.phoneNumber,
        hidden: entity.primaryPhone.hidden,
        isPrimary: true,
      });
    }
    if (entity.secondaryPhone) {
      rows.push({
        phoneCode: entity.secondaryPhone.phoneCode,
        phoneNumber: entity.secondaryPhone.phoneNumber,
        hidden: entity.secondaryPhone.hidden,
        isPrimary: false,
      });
    }
    return rows;
  }

  private buildAddressCreateData(entity: User): any[] {
    const rows: any[] = [];
    if (entity.presentAddress) {
      const a = entity.presentAddress;
      rows.push({
        addressType: 'PRESENT',
        addressLine1: a.addressLine1, addressLine2: a.addressLine2 ?? null,
        addressLine3: a.addressLine3 ?? null, hometown: a.hometown,
        zipCode: a.zipCode, state: a.state, district: a.district, country: a.country,
      });
    }
    if (entity.permanentAddress) {
      const a = entity.permanentAddress;
      rows.push({
        addressType: 'PERMANENT',
        addressLine1: a.addressLine1, addressLine2: a.addressLine2 ?? null,
        addressLine3: a.addressLine3 ?? null, hometown: a.hometown,
        zipCode: a.zipCode, state: a.state, district: a.district, country: a.country,
      });
    }
    return rows;
  }

  private buildSocialLinkCreateData(entity: User): any[] {
    return entity.socialMediaLinks.map((l) => ({
      linkName: l.linkName,
      linkType: l.linkType,
      linkValue: l.linkValue,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));
  }
}
