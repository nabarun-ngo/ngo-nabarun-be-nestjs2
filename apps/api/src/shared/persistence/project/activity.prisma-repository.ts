import { Injectable } from '@nestjs/common';
import { BaseFilter, Page } from '@nabarun-ngo/nestjs-shared-core';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { Prisma, PrismaClient } from '../prisma/client';
import { Activity, ActivityFilter } from '../../../modules/project/domain/aggregates/activity/activity.aggregate';
import { IActivityRepository } from '../../../modules/project/domain/repositories/activity.repository';
import { ActivityPrismaMapper } from './activity-prisma.mapper';

@Injectable()
export class ActivityPrismaRepository implements IActivityRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: ActivityFilter): Promise<number> {
    return this.database.client.activity.count({ where: this.where(filter) });
  }

  async findPaged(filter?: BaseFilter<ActivityFilter>): Promise<Page<Activity>> {
    const where = this.where(filter?.props);
    const pageIndex = filter?.pageIndex ?? 0;
    const pageSize = filter?.pageSize ?? 20;
    const [data, total] = await Promise.all([
      this.database.client.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { project: true, assignee: true, organizer: true, parentActivity: true },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      this.database.client.activity.count({ where }),
    ]);
    return new Page(data.map((a) => ActivityPrismaMapper.toDomain(a)!), total, pageIndex, pageSize);
  }

  async findAll(filter?: ActivityFilter): Promise<Activity[]> {
    const rows = await this.database.client.activity.findMany({
      where: this.where(filter),
      orderBy: { createdAt: 'desc' },
      include: { project: true, assignee: true, organizer: true, parentActivity: true },
    });
    return rows.map((a) => ActivityPrismaMapper.toDomain(a)!);
  }

  async findById(id: string): Promise<Activity | null> {
    const row = await this.database.client.activity.findUnique({
      where: { id },
      include: { project: true, assignee: true, organizer: true, parentActivity: true },
    });
    return ActivityPrismaMapper.toDomain(row);
  }

  async create(entity: Activity): Promise<Activity> {
    const row = await this.database.client.activity.create({
      data: ActivityPrismaMapper.toCreate(entity),
      include: { project: true, assignee: true, organizer: true, parentActivity: true },
    });
    return ActivityPrismaMapper.toDomain(row)!;
  }

  async update(id: string, entity: Activity): Promise<Activity> {
    const row = await this.database.client.activity.update({
      where: { id },
      data: ActivityPrismaMapper.toUpdate(entity),
      include: { project: true, assignee: true, organizer: true, parentActivity: true },
    });
    return ActivityPrismaMapper.toDomain(row)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.activity.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private where(props?: ActivityFilter): Prisma.ActivityWhereInput {
    return {
      ...(props?.projectId ? { projectId: props.projectId } : {}),
      ...(props?.scale ? { scale: props.scale } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.type ? { type: props.type } : {}),
      ...(props?.assignedTo ? { assignedTo: props.assignedTo } : {}),
      ...(props?.organizerId ? { organizerId: props.organizerId } : {}),
      ...(props?.parentActivityId ? { parentActivityId: props.parentActivityId } : {}),
      deletedAt: null,
    };
  }
}
