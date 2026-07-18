import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { BaseFilter, Page } from '@nabarun-ngo/nestjs-shared-core';
import { Prisma, PrismaClient } from '../prisma/client';
import { IDonationRepository, DonationFilter } from '../../../modules/finance/domain/repositories/donation.repository';
import { Donation } from '../../../modules/finance/domain/aggregates/donation/donation.aggregate';
import { DonationStatus } from '../../../modules/finance/domain/enums/donation-status.enum';
import { DonationType } from '../../../modules/finance/domain/enums/donation-type.enum';
import { DonationPrismaMapper } from './donation-prisma.mapper';

export type FullDonation = Prisma.DonationGetPayload<{
  include: {
    donor: true;
    paidToAccount: true;
    confirmedBy: true;
    activity: true;
  };
}>;

export type OnlyDonation = Prisma.DonationGetPayload<{
  include: {
    donor: true;
    paidToAccount: false;
  };
}>;


@Injectable()
export class DonationPrismaRepository implements IDonationRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: DonationFilter): Promise<number> {
    const where = this.whereQuery(filter);
    return await this.database.client.donation.count({ where });
  }

  async findPaged(filter?: BaseFilter<DonationFilter>): Promise<Page<Donation>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.database.client.donation.findMany({
        where,
        orderBy: {
          ...filter?.props?.isGuest ? { raisedOn: 'desc' } : { startDate: 'desc' }
        },
        include: {
          donor: true,
          paidToAccount: true,
          confirmedBy: true,
          activity: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.database.client.donation.count({ where }),
    ]);
    return new Page<Donation>(
      data.map(m => DonationPrismaMapper.toDonationDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: DonationFilter): Promise<Donation[]> {
    const donations = await this.database.client.donation.findMany({
      where: this.whereQuery(filter),
      orderBy: {
        raisedOn: 'desc'
      },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return donations.map((m) => DonationPrismaMapper.toDonationDomain(m)!);
  }

  private whereQuery(props?: DonationFilter): Prisma.DonationWhereInput {
    const where: Prisma.DonationWhereInput = {
      ...(props?.type && props.type.length > 0 ? { type: { in: props.type } } : {}),
      ...(props?.status && props.status.length > 0 ? { status: { in: props.status } } : {}),
      ...(props?.forEventId ? { forEventId: props.forEventId } : {}),

      ...(props?.donorId ? { donorId: props.donorId } : {}),
      ...(props?.donorName ? {
        OR: [
          { donorName: { contains: props.donorName, mode: 'insensitive' } },
          {
            donor: {
              AND: props.donorName.trim().split(/\s+/).map((word) => ({
                OR: [{ firstName: { contains: word, mode: 'insensitive' } }, { lastName: { contains: word, mode: 'insensitive' } }],
              })),
            }
          },
        ],
      } : {}),
      ...(props?.donationId ? { id: props.donationId } : {}),
      ...(props?.isGuest ? { isGuest: props.isGuest } : {}),
      ...(props?.startDate_raisedOn || props?.endDate_raisedOn
        ? {
          raisedOn: {
            ...(props.startDate_raisedOn ? { gte: props.startDate_raisedOn } : {}),
            ...(props.endDate_raisedOn ? { lte: props.endDate_raisedOn } : {}),
          },
        }
        : {}),
      ...(props?.startDate_confirmedOn || props?.endDate_confirmedOn
        ? {
          confirmedOn: {
            ...(props.startDate_confirmedOn ? { gte: props.startDate_confirmedOn } : {}),
            ...(props.endDate_confirmedOn ? { lte: props.endDate_confirmedOn } : {}),
          },
        }
        : {}),
      ...(props?.startDate_paidOn || props?.endDate_paidOn
        ? {
          paidOn: {
            ...(props.startDate_paidOn ? { gte: props.startDate_paidOn } : {}),
            ...(props.endDate_paidOn ? { lte: props.endDate_paidOn } : {}),
          },
        }
        : {}),
      ...(props?.startDate_lte ? {
        OR: [
          { startDate: { lte: props.startDate_lte } },
          { AND: [{ startDate: null }, { raisedOn: { lte: props.startDate_lte } }] }
        ]
      } : {}),
      ...(props?.endDate_gte ? { endDate: { gte: props.endDate_gte } } : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Donation | null> {
    const donation = await this.database.client.donation.findUnique({
      where: { id },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return DonationPrismaMapper.toDonationDomain(donation as any);
  }

  async findByDonorId(donorId: string): Promise<Donation[]> {
    const donations = await this.database.client.donation.findMany({
      where: { donorId, deletedAt: null },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return donations.map(m => DonationPrismaMapper.toDonationDomain(m)!);
  }

  async findByStatus(status: DonationStatus): Promise<Donation[]> {
    const donations = await this.database.client.donation.findMany({
      where: { status, deletedAt: null },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return donations.map(m => DonationPrismaMapper.toDonationDomain(m)!);
  }

  async findByType(type: DonationType): Promise<Donation[]> {
    const donations = await this.database.client.donation.findMany({
      where: { type, deletedAt: null },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return donations.map(m => DonationPrismaMapper.toDonationDomain(m)!);
  }

  async findPendingRegularDonations(): Promise<Donation[]> {
    const donations = await this.database.client.donation.findMany({
      where: {
        type: DonationType.REGULAR,
        status: DonationStatus.RAISED,
        deletedAt: null,
      },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return donations.map(m => DonationPrismaMapper.toDonationDomain(m)!);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Donation[]> {
    const donations = await this.database.client.donation.findMany({
      where: {
        raisedOn: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return donations.map(m => DonationPrismaMapper.toDonationDomain(m)!);
  }

  async create(donation: Donation): Promise<Donation> {
    const createData: Prisma.DonationUncheckedCreateInput = {
      ...DonationPrismaMapper.toDonationCreatePersistence(donation),
    };

    const created = await this.database.client.donation.create({
      data: createData,
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return DonationPrismaMapper.toDonationDomain(created)!;
  }

  async update(id: string, donation: Donation): Promise<Donation> {
    const updateData: Prisma.DonationUncheckedUpdateInput = {
      ...DonationPrismaMapper.toDonationUpdatePersistence(donation),
    };

    const updated = await this.database.client.donation.update({
      where: { id },
      data: updateData,
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
        activity: true,
      },
    });

    return DonationPrismaMapper.toDonationDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.donation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

