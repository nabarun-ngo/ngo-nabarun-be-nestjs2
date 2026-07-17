import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence'
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { Notification, NotificationFilter, NotificationType, NotificationCategory, NotificationPriority } from '@ce/nestjs-shared-correspondence/domain/aggregates/notification.aggregate';
import { UserNotification } from '@ce/nestjs-shared-correspondence/domain/aggregates/user-notification.aggregate';
import { INotificationRepository } from '@ce/nestjs-shared-correspondence/domain/repositories/notification.repository';

@Injectable()
export class NotificationPrismaRepository implements INotificationRepository {
  constructor(private readonly prisma: BasePrismaService) {}

  async create(notification: Notification): Promise<Notification> {
    const row = await (this.prisma).corr2Notification.create({
      data: this.toCreateData(notification),
    });
    return this.toDomain(row);
  }

  async createWithUserNotifications(
    notification: Notification,
    userNotifications: UserNotification[],
  ): Promise<Notification> {
    const row = await (this.prisma).corr2Notification.create({
      data: {
        ...this.toCreateData(notification),
        userNotifications: {
          create: userNotifications.map((un) => ({
            id: un.id,
            userId: un.userId,
            isRead: false,
            isArchived: false,
            isPushSent: false,
            pushDelivered: false,
            createdAt: un.createdAt,
            updatedAt: un.updatedAt,
          })),
        },
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, notification: Notification): Promise<Notification> {
    const row = await (this.prisma).corr2Notification.update({
      where: { id },
      data: {
        title: notification.title,
        body: notification.body,
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        updatedAt: notification.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma).corr2Notification.delete({ where: { id } });
  }

  async findById(id: string): Promise<Notification | null> {
    const row = await (this.prisma).corr2Notification.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filter?: NotificationFilter): Promise<Notification[]> {
    const rows = await (this.prisma).corr2Notification.findMany({
      where: this.buildWhere(filter),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findPaged(filter?: BaseFilter<NotificationFilter>): Promise<Page<Notification>> {
    const where = this.buildWhere(filter?.props);
    const pageIndex = filter?.pageIndex ?? 0;
    const pageSize = filter?.pageSize ?? 50;
    const [rows, total] = await Promise.all([
      (this.prisma).corr2Notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      (this.prisma).corr2Notification.count({ where }),
    ]);
    return new Page(rows.map((r: any) => this.toDomain(r)), total, pageIndex, pageSize);
  }

  async count(filter: NotificationFilter): Promise<number> {
    return (this.prisma).corr2Notification.count({ where: this.buildWhere(filter) });
  }

  async bulkMarkPushSent(
    userNotificationIds: string[],
    success: boolean,
    error?: string,
  ): Promise<void> {
    await (this.prisma).corr2UserNotification.updateMany({
      where: { id: { in: userNotificationIds } },
      data: {
        isPushSent: true,
        pushSentAt: new Date(),
        pushDelivered: success,
        pushError: error ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async deleteExpiredBefore(date: Date): Promise<number> {
    const result = await (this.prisma).corr2Notification.deleteMany({
      where: { expiresAt: { not: null, lt: date } },
    });
    return result.count;
  }

  private buildWhere(filter?: NotificationFilter): Record<string, any> {
    if (!filter) return {};
    return {
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.priority ? { priority: filter.priority } : {}),
      ...(filter.referenceId ? { referenceId: filter.referenceId } : {}),
      ...(filter.referenceType ? { referenceType: filter.referenceType } : {}),
      ...(filter.dispatchId ? { dispatchId: filter.dispatchId } : {}),
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

  private toCreateData(notification: Notification): Record<string, any> {
    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      category: notification.category,
      priority: notification.priority,
      actionUrl: notification.action?.url ?? null,
      actionType: notification.action?.type ?? null,
      actionData: notification.action?.data ?? null,
      referenceId: notification.referenceId ?? null,
      referenceType: notification.referenceType ?? null,
      dispatchId: notification.dispatchId ?? null,
      imageUrl: notification.imageUrl ?? null,
      icon: notification.icon ?? null,
      metadata: (notification.metadata) ?? null,
      expiresAt: notification.expiresAt ?? null,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private toDomain(row: any): Notification {
    return new Notification(row.id, row.title, row.body, row.type as NotificationType, row.category as NotificationCategory, {
      priority: row.priority as NotificationPriority,
      action:
        row.actionUrl || row.actionType || row.actionData
          ? { url: row.actionUrl ?? undefined, type: row.actionType ?? undefined, data: row.actionData ?? undefined }
          : undefined,
      referenceId: row.referenceId ?? undefined,
      referenceType: row.referenceType ?? undefined,
      dispatchId: row.dispatchId ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      icon: row.icon ?? undefined,
      metadata: row.metadata ?? undefined,
      expiresAt: row.expiresAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
