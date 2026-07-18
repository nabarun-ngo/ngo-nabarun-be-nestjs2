import { Injectable } from '@nestjs/common';
import { BaseFilter, Page } from '@nabarun-ngo/nestjs-shared-core';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { Prisma, PrismaClient } from '../prisma/client';
import { Project, ProjectFilter } from '../../../modules/project/domain/aggregates/project/project.aggregate';
import { IProjectRepository } from '../../../modules/project/domain/repositories/project.repository';
import { ProjectPrismaMapper } from './project-prisma.mapper';

@Injectable()
export class ProjectPrismaRepository implements IProjectRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: ProjectFilter): Promise<number> {
    return this.database.client.project.count({ where: this.where(filter) });
  }

  async findPaged(filter?: BaseFilter<ProjectFilter>): Promise<Page<Project>> {
    const where = this.where(filter?.props);
    const pageIndex = filter?.pageIndex ?? 0;
    const pageSize = filter?.pageSize ?? 20;
    const [data, total] = await Promise.all([
      this.database.client.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { manager: true, sponsor: true },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      this.database.client.project.count({ where }),
    ]);
    return new Page(data.map((p) => ProjectPrismaMapper.toDomain(p)!), total, pageIndex, pageSize);
  }

  async findAll(filter?: ProjectFilter): Promise<Project[]> {
    const rows = await this.database.client.project.findMany({
      where: this.where(filter),
      orderBy: { createdAt: 'desc' },
      include: { manager: true, sponsor: true },
    });
    return rows.map((p) => ProjectPrismaMapper.toDomain(p)!);
  }

  async findById(id: string): Promise<Project | null> {
    const row = await this.database.client.project.findUnique({
      where: { id },
      include: { manager: true, sponsor: true },
    });
    return ProjectPrismaMapper.toDomain(row);
  }

  async findByCode(code: string): Promise<Project | null> {
    const row = await this.database.client.project.findUnique({
      where: { code },
      include: { manager: true, sponsor: true },
    });
    return ProjectPrismaMapper.toDomain(row);
  }

  async create(entity: Project): Promise<Project> {
    const row = await this.database.client.project.create({
      data: ProjectPrismaMapper.toCreate(entity),
      include: { manager: true, sponsor: true },
    });
    return ProjectPrismaMapper.toDomain(row)!;
  }

  async update(id: string, entity: Project): Promise<Project> {
    const row = await this.database.client.project.update({
      where: { id },
      data: ProjectPrismaMapper.toUpdate(entity),
      include: { manager: true, sponsor: true },
    });
    return ProjectPrismaMapper.toDomain(row)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private where(props?: ProjectFilter): Prisma.ProjectWhereInput {
    return {
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.category ? { category: props.category } : {}),
      ...(props?.phase ? { phase: props.phase } : {}),
      ...(props?.managerId ? { managerId: props.managerId } : {}),
      ...(props?.sponsorId ? { sponsorId: props.sponsorId } : {}),
      ...(props?.location ? { location: { contains: props.location, mode: 'insensitive' } } : {}),
      ...(props?.tags?.length ? { tags: { hasSome: props.tags } } : {}),
      deletedAt: null,
    };
  }
}
