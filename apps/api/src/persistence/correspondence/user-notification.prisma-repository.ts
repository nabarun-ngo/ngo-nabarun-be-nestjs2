import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { UserNotification, UserNotificationFilter } from '@ce/nestjs-shared-correspondence/domain/aggregates/user-notification.aggregate';
import { IUserNotificationRepository } from '@ce/nestjs-shared-correspondence/domain/repositories/user-notification.repository';

@Injectable()
export class UserNotificationPrismaRepository implements IUserNotificationRepository {
  constructor(private readonly prisma: BasePrismaService) {}

  async create(entity: UserNotification): Promise<UserNotification> {
    const row = await (this.prisma).corr2UserNotification.create({
      data: this.toCreateData(entity),
    });
    return this.toDomain(row);
  }

  async update(id: string, entity: UserNotification): Promise<UserNotification> {
    const row = await (this.prisma).corr2UserNotification.update({
      where: { id },
      data: {
        isRead: entity.isRead,
        readAt: entity.readAt ?? null,
        isArchived: entity.isArchived,
        archivedAt: entity.archivedAt ?? null,
        isPushSent: entity.isPushSent,
        pushSentAt: entity.pushSentAt ?? null,
        pushDelivered: entity.pushDelivered,
        pushError: entity.pushError ?? null,
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma).corr2UserNotification.delete({ where: { id } });
  }

  async findById(id: string): Promise<UserNotification | null> {
    const row = await (this.prisma).corr2UserNotification.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserAndNotification(
    userId: string,
    notificationId: string,
  ): Promise<UserNotification | null> {
    const row = await (this.prisma).corr2UserNotification.findFirst({
      where: { userId, notificationId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filter?: UserNotificationFilter): Promise<UserNotification[]> {
    const rows = await (this.prisma).corr2UserNotification.findMany({
      where: this.buildWhere(filter),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findPaged(filter?: BaseFilter<UserNotificationFilter>): Promise<Page<UserNotification>> {
    const where = this.buildWhere(filter?.props);
    const pageIndex = filter?.pageIndex ?? 0;
    const pageSize = filter?.pageSize ?? 50;
    const [rows, total] = await Promise.all([
      (this.prisma).corr2UserNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      (this.prisma).corr2UserNotification.count({ where }),
    ]);
    return new Page(rows.map((r: any) => this.toDomain(r)), total, pageIndex, pageSize);
  }

  async count(filter: UserNotificationFilter): Promise<number> {
    return (this.prisma).corr2UserNotification.count({ where: this.buildWhere(filter) });
  }

  async countUnread(userId: string): Promise<number> {
    return (this.prisma).corr2UserNotification.count({
      where: { userId, isRead: false, isArchived: false },
    });
  }

  async markAllReadForUser(userId: string): Promise<void> {
    const now = new Date();
    await (this.prisma).corr2UserNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: now, updatedAt: now },
    });
  }

  private buildWhere(filter?: UserNotificationFilter): Record<string, any> {
    if (!filter) return {};
    return {
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.notificationId ? { notificationId: filter.notificationId } : {}),
      ...(filter.isRead !== undefined ? { isRead: filter.isRead } : {}),
      ...(filter.isArchived !== undefined ? { isArchived: filter.isArchived } : {}),
      ...(filter.isPushSent !== undefined ? { isPushSent: filter.isPushSent } : {}),
      ...(filter.pushDelivered !== undefined ? { pushDelivered: filter.pushDelivered } : {}),
      ...(filter.fromDate || filter.toDate
        ? {
            createdAt: {
              ...(filter.fromDate ? { gte: filter.fromDate } : {}),
              ...(filter.toDate ? { lte: filter.toDate } : {}),
            },
          }
        : {}),
    };
  }

  private toCreateData(entity: UserNotification): Record<string, any> {
    return {
      id: entity.id,
      notificationId: entity.notificationId,
      userId: entity.userId,
      isRead: entity.isRead,
      isArchived: entity.isArchived,
      isPushSent: entity.isPushSent,
      pushDelivered: entity.pushDelivered,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toDomain(row: any): UserNotification {
    return new UserNotification(row.id, row.notificationId, row.userId, {
      isRead: row.isRead,
      readAt: row.readAt ?? undefined,
      isArchived: row.isArchived,
      archivedAt: row.archivedAt ?? undefined,
      isPushSent: row.isPushSent,
      pushSentAt: row.pushSentAt ?? undefined,
      pushDelivered: row.pushDelivered,
      pushError: row.pushError ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
