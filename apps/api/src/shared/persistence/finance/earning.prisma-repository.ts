import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { Prisma, PrismaClient } from '../prisma/client';
import { IEarningRepository, EarningFilter } from '../../../internal/finance/domain/repositories/earning.repository';
import { Earning } from '../../../internal/finance/domain/aggregates/earning/earning.aggregate';
import { EarningPrismaMapper } from './earning-prisma.mapper';

export type EarningPersistence = Prisma.EarningGetPayload<{
  include: {
    account: true;
    createdBy: true;
    receivedBy: true;
  }
}>;

@Injectable()
export class EarningPrismaRepository implements IEarningRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: EarningFilter): Promise<number> {
    const where = this.whereQuery(filter);
    return await this.database.client.earning.count({ where });
  }

  async findPaged(filter?: BaseFilter<EarningFilter>): Promise<Page<Earning>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.database.client.earning.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          account: true,
          createdBy: true,
          receivedBy: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.database.client.earning.count({ where }),
    ]);

    return new Page<Earning>(
      data.map(m => EarningPrismaMapper.toEarningDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: EarningFilter): Promise<Earning[]> {
    const earnings = await this.database.client.earning.findMany({
      where: this.whereQuery(filter),
      orderBy: { createdAt: 'desc' },
      include: {
        account: true,
        createdBy: true,
        receivedBy: true,
      },
    });

    return earnings.map(m => EarningPrismaMapper.toEarningDomain(m)!);
  }

  private whereQuery(props?: EarningFilter): Prisma.EarningWhereInput {
    const where: Prisma.EarningWhereInput = {
      ...(props?.category ? { category: { in: props.category } } : {}),
      ...(props?.source ? { source: props.source } : {}),
      ...(props?.status ? { status: { in: props.status } } : {}),
      ...(props?.startDate || props?.endDate
        ? {
          earningDate: {
            ...(props.startDate ? { gte: props.startDate } : {}),
            ...(props.endDate ? { lte: props.endDate } : {}),
          },
        }
        : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Earning | null> {
    const earning = await this.database.client.earning.findUnique({
      where: { id },
      include: {
        account: true,
        createdBy: true,
        receivedBy: true,
      },
    });

    return EarningPrismaMapper.toEarningDomain(earning!);
  }


  async create(earning: Earning): Promise<Earning> {
    const createData: Prisma.EarningUncheckedCreateInput = {
      ...EarningPrismaMapper.toEarningCreatePersistence(earning),
    };

    const created = await this.database.client.earning.create({
      data: createData,
      include: {
        account: true,
        createdBy: true,
        receivedBy: true,
      },
    });

    return EarningPrismaMapper.toEarningDomain(created)!;
  }

  async update(id: string, earning: Earning): Promise<Earning> {
    const updateData: Prisma.EarningUncheckedUpdateInput = {
      ...EarningPrismaMapper.toEarningUpdatePersistence(earning),
    };

    const updated = await this.database.client.earning.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        createdBy: true,
        receivedBy: true,
      },
    });

    return EarningPrismaMapper.toEarningDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.earning.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

