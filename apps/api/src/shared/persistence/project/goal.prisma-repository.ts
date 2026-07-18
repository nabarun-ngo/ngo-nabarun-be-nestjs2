import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { Prisma, PrismaClient } from '../prisma/client';
import { IGoalRepository } from '../../../modules/project/domain/repositories/goal.repository';
import { Goal, GoalFilter } from '../../../modules/project/domain/aggregates/goal/goal.aggregate';
import { GoalPrismaMapper } from './goal-prisma.mapper';
@Injectable()
export class GoalPrismaRepository implements IGoalRepository {
  constructor(private readonly db: BasePrismaService<PrismaClient>) { }
  private where(props?: GoalFilter): Prisma.GoalWhereInput {
    return { deletedAt: null, ...(props?.projectId ? { projectId: props.projectId } : {}), ...(props?.status ? { status: props.status } : {}), ...(props?.priority ? { priority: props.priority } : {}) };
  }
  async count(f: GoalFilter) { return this.db.client.goal.count({ where: this.where(f) }); }
  async findPaged(filter?: BaseFilter<GoalFilter>): Promise<Page<Goal>> {
    const where = this.where(filter?.props);
    const [rows, total] = await Promise.all([
      this.db.client.goal.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 20), take: filter?.pageSize ?? 20 }),
      this.db.client.goal.count({ where }),
    ]);
    return new Page(rows.map((r) => GoalPrismaMapper.toDomain(r)!), total, filter?.pageIndex ?? 0, filter?.pageSize ?? 20);
  }
  async findAll(filter?: GoalFilter) { return (await this.db.client.goal.findMany({ where: this.where(filter) })).map((r) => GoalPrismaMapper.toDomain(r)!); }
  async findById(id: string) { return GoalPrismaMapper.toDomain(await this.db.client.goal.findUnique({ where: { id } })); }
  async create(e: Goal) { return GoalPrismaMapper.toDomain(await this.db.client.goal.create({ data: GoalPrismaMapper.toCreate(e) }))!; }
  async update(id: string, e: Goal) { return GoalPrismaMapper.toDomain(await this.db.client.goal.update({ where: { id }, data: GoalPrismaMapper.toUpdate(e) }))!; }
  async delete(id: string) { await this.db.client.goal.update({ where: { id }, data: { deletedAt: new Date() } }); }
}
