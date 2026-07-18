import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { Prisma, PrismaClient } from '../prisma/client';
import { IBeneficiaryRepository } from '../../../modules/project/domain/repositories/beneficiary.repository';
import { Beneficiary, BeneficiaryFilter } from '../../../modules/project/domain/aggregates/beneficiary/beneficiary.aggregate';
import { BeneficiaryPrismaMapper } from './beneficiary-prisma.mapper';

@Injectable()
export class BeneficiaryPrismaRepository implements IBeneficiaryRepository {
  constructor(private readonly db: BasePrismaService<PrismaClient>) { }
  private where(props?: BeneficiaryFilter): Prisma.BeneficiaryWhereInput {
    return {
      deletedAt: null,
      ...(props?.projectId ? { projectId: props.projectId } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.type ? { type: props.type } : {}),
      ...(props?.category ? { category: props.category } : {}),
    };
  }
  async count(filter: BeneficiaryFilter): Promise<number> { return this.db.client.beneficiary.count({ where: this.where(filter) }); }
  async countByProject(projectId: string): Promise<number> { return this.count({ projectId }); }
  async findPaged(filter?: BaseFilter<BeneficiaryFilter>): Promise<Page<Beneficiary>> {
    const where = this.where(filter?.props);
    const [rows, total] = await Promise.all([
      this.db.client.beneficiary.findMany({ where, orderBy: { enrollmentDate: 'desc' }, skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 20), take: filter?.pageSize ?? 20 }),
      this.db.client.beneficiary.count({ where }),
    ]);
    return new Page(rows.map((r) => BeneficiaryPrismaMapper.toDomain(r)!), total, filter?.pageIndex ?? 0, filter?.pageSize ?? 20);
  }
  async findAll(filter?: BeneficiaryFilter): Promise<Beneficiary[]> {
    const rows = await this.db.client.beneficiary.findMany({ where: this.where(filter), orderBy: { enrollmentDate: 'desc' } });
    return rows.map((r) => BeneficiaryPrismaMapper.toDomain(r)!);
  }
  async findById(id: string): Promise<Beneficiary | null> { return BeneficiaryPrismaMapper.toDomain(await this.db.client.beneficiary.findUnique({ where: { id } })); }
  async create(entity: Beneficiary): Promise<Beneficiary> { return BeneficiaryPrismaMapper.toDomain(await this.db.client.beneficiary.create({ data: BeneficiaryPrismaMapper.toCreate(entity) }))!; }
  async update(id: string, entity: Beneficiary): Promise<Beneficiary> { return BeneficiaryPrismaMapper.toDomain(await this.db.client.beneficiary.update({ where: { id }, data: BeneficiaryPrismaMapper.toUpdate(entity) }))!; }
  async delete(id: string): Promise<void> { await this.db.client.beneficiary.update({ where: { id }, data: { deletedAt: new Date() } }); }
}
