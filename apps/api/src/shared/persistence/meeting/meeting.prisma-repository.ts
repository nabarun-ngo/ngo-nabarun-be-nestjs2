import { Injectable } from '@nestjs/common';
import { BaseFilter, Page } from '@nabarun-ngo/nestjs-shared-core';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { Prisma, PrismaClient } from '../prisma/client';
import { Meeting, MeetingFilter } from '../../../modules/meeting/domain/aggregates/meeting/meeting.aggregate';
import { IMeetingRepository } from '../../../modules/meeting/domain/repositories/meeting.repository';
import { MeetingPrismaMapper } from './meeting-prisma.mapper';

@Injectable()
export class MeetingPrismaRepository implements IMeetingRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: MeetingFilter): Promise<number> {
    return this.database.client.meeting.count({ where: this.where(filter) });
  }

  async findPaged(filter?: BaseFilter<MeetingFilter>): Promise<Page<Meeting>> {
    const where = this.where(filter?.props);
    const pageIndex = filter?.pageIndex ?? 0;
    const pageSize = filter?.pageSize ?? 20;
    const [rows, total] = await Promise.all([
      this.database.client.meeting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      this.database.client.meeting.count({ where }),
    ]);
    return new Page(rows.map((r) => MeetingPrismaMapper.toDomain(r)!), total, pageIndex, pageSize);
  }

  async findAll(filter?: MeetingFilter): Promise<Meeting[]> {
    const rows = await this.database.client.meeting.findMany({
      where: this.where(filter),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => MeetingPrismaMapper.toDomain(r)!);
  }

  async findById(id: string): Promise<Meeting | null> {
    const row = await this.database.client.meeting.findUnique({ where: { id } });
    return MeetingPrismaMapper.toDomain(row);
  }

  async findByExtId(extId: string): Promise<Meeting | null> {
    const row = await this.database.client.meeting.findUnique({ where: { extMeetingId: extId } });
    return MeetingPrismaMapper.toDomain(row);
  }

  async findByTimeRange(startGte: Date, startLte: Date, endGte: Date, endLte: Date): Promise<Meeting[]> {
    const rows = await this.database.client.meeting.findMany({
      where: {
        deletedAt: null,
        startTime: { gte: startGte, lte: startLte },
        endTime: { gte: endGte, lte: endLte },
      },
    });
    return rows.map((r) => MeetingPrismaMapper.toDomain(r)!);
  }

  async create(entity: Meeting): Promise<Meeting> {
    const row = await this.database.client.meeting.create({ data: MeetingPrismaMapper.toCreate(entity) });
    return MeetingPrismaMapper.toDomain(row)!;
  }

  async update(id: string, entity: Meeting): Promise<Meeting> {
    const row = await this.database.client.meeting.update({
      where: { id },
      data: MeetingPrismaMapper.toUpdate(entity),
    });
    return MeetingPrismaMapper.toDomain(row)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.meeting.update({ where: { id }, data: { deletedAt: new Date(), status: 'cancelled' } });
  }

  private where(props?: MeetingFilter): Prisma.MeetingWhereInput {
    return {
      deletedAt: null,
      ...(props?.createdById ? { createdById: props.createdById } : {}),
      ...(props?.participantId ? { attendees: { contains: props.participantId } } : {}),
      ...(props?.participantEmail ? { attendees: { contains: props.participantEmail } } : {}),
    };
  }
}
