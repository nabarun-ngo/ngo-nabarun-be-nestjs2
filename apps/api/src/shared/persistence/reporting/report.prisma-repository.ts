import { Injectable } from '@nestjs/common';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { Prisma, PrismaClient } from '../prisma/client';
import { Report, ReportFilter } from '../../../modules/reporting/domain/aggregates/report/report.aggregate';
import { IReportRepository } from '../../../modules/reporting/domain/repositories/report.repository';
import { ReportPrismaMapper } from './report-prisma.mapper';

const includeUsers = {
  requestedBy: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class ReportPrismaRepository implements IReportRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter?: ReportFilter): Promise<number> {
    return this.database.client.report.count({ where: this.whereQuery(filter) });
  }

  async findAll(filter?: ReportFilter): Promise<Report[]> {
    const rows = await this.database.client.report.findMany({
      where: this.whereQuery(filter),
      include: includeUsers,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ReportPrismaMapper.toDomain(row)!);
  }

  async findById(id: string): Promise<Report | null> {
    const row = await this.database.client.report.findUnique({
      where: { id },
      include: includeUsers,
    });
    return ReportPrismaMapper.toDomain(row);
  }

  async findPaged(filter?: BaseFilter<ReportFilter>): Promise<Page<Report>> {
    const where = this.whereQuery(filter?.props);
    const pageIndex = filter?.pageIndex ?? 0;
    const pageSize = filter?.pageSize ?? 20;
    const [rows, total] = await Promise.all([
      this.database.client.report.findMany({
        where,
        include: includeUsers,
        orderBy: { createdAt: 'desc' },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      this.database.client.report.count({ where }),
    ]);
    return new Page(
      rows.map((row) => ReportPrismaMapper.toDomain(row)!),
      total,
      pageIndex,
      pageSize,
    );
  }

  async create(entity: Report): Promise<Report> {
    const created = await this.database.client.report.create({
      data: ReportPrismaMapper.toCreatePersistence(entity),
      include: includeUsers,
    });
    return ReportPrismaMapper.toDomain(created)!;
  }

  async update(id: string, entity: Report): Promise<Report> {
    const updated = await this.database.client.report.update({
      where: { id },
      data: ReportPrismaMapper.toUpdatePersistence(entity),
      include: includeUsers,
    });
    return ReportPrismaMapper.toDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.report.delete({ where: { id } });
  }

  private whereQuery(filter?: ReportFilter): Prisma.ReportWhereInput {
    return {
      ...(filter?.reportCode ? { reportCode: filter.reportCode } : {}),
      ...(filter?.status?.length ? { status: { in: filter.status } } : {}),
      ...(filter?.requestedById ? { requestedById: filter.requestedById } : {}),
    };
  }
}
