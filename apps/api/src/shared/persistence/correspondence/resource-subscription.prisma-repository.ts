import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { BaseFilter, Page } from '@nabarun-ngo/nestjs-shared-core';
import { ResourceSubscription, SubscriptionFilter, SubscriberType, SubscribedVia } from '@nabarun-ngo/nestjs-shared-correspondence/domain/aggregates/resource-subscription.aggregate';
import { SubscriptionChannel } from '@nabarun-ngo/nestjs-shared-correspondence/domain/entities/subscription-channel.entity';
import { ChannelType } from '@nabarun-ngo/nestjs-shared-correspondence/domain/enums/channel-type.enum';
import { EmailRole } from '@nabarun-ngo/nestjs-shared-correspondence/domain/enums/email-role.enum';
import { IResourceSubscriptionRepository } from '@nabarun-ngo/nestjs-shared-correspondence/domain/repositories/resource-subscription.repository';

@Injectable()
export class ResourceSubscriptionPrismaRepository implements IResourceSubscriptionRepository {
  constructor(private readonly prisma: BasePrismaService) { }

  async create(subscription: ResourceSubscription): Promise<ResourceSubscription> {
    const row = await (this.prisma).corr2ResourceSubscription.create({
      data: {
        id: subscription.id,
        subscriberType: subscription.subscriberType,
        userId: subscription.userId ?? null,
        userEmail: subscription.userEmail ?? null,
        userName: subscription.userName ?? null,
        roleName: subscription.roleName ?? null,
        resourceType: subscription.resourceType,
        resourceId: subscription.resourceId ?? null,
        subscribedVia: subscription.subscribedVia,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        channels: {
          create: subscription.channels.map((c) => ({
            id: c.id,
            channel: c.channel,
            enabled: c.enabled,
            emailRole: c.emailRole ?? null,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
        },
      },
      include: { channels: true },
    });
    return this.toDomain(row);
  }

  async update(id: string, subscription: ResourceSubscription): Promise<ResourceSubscription> {
    await (this.prisma).corr2ResourceSubscription.update({
      where: { id },
      data: {
        isActive: subscription.isActive,
        userEmail: subscription.userEmail ?? null,
        updatedAt: subscription.updatedAt,
      },
    });

    for (const channel of subscription.channels) {
      await (this.prisma).corr2SubscriptionChannel.upsert({
        where: { corr_subscriptionChannel_unique: { subscriptionId: id, channel: channel.channel } },
        create: {
          id: channel.id,
          subscriptionId: id,
          channel: channel.channel,
          enabled: channel.enabled,
          emailRole: channel.emailRole ?? null,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
        },
        update: {
          enabled: channel.enabled,
          emailRole: channel.emailRole ?? null,
          updatedAt: channel.updatedAt,
        },
      });
    }

    const row = await (this.prisma).corr2ResourceSubscription.findUnique({
      where: { id },
      include: { channels: true },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma).corr2ResourceSubscription.delete({ where: { id } });
  }

  async findById(id: string): Promise<ResourceSubscription | null> {
    const row = await (this.prisma).corr2ResourceSubscription.findUnique({
      where: { id },
      include: { channels: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserAndResource(
    userId: string,
    resourceType: string,
    resourceId?: string,
  ): Promise<ResourceSubscription | null> {
    const row = await (this.prisma).corr2ResourceSubscription.findFirst({
      where: { userId, resourceType, resourceId: resourceId ?? null },
      include: { channels: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByRoleAndResource(
    roleName: string,
    resourceType: string,
    resourceId?: string,
  ): Promise<ResourceSubscription | null> {
    const row = await (this.prisma).corr2ResourceSubscription.findFirst({
      where: { roleName, resourceType, resourceId: resourceId ?? null },
      include: { channels: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findActiveSubscribersForResource(
    resourceType: string,
    resourceId?: string,
  ): Promise<ResourceSubscription[]> {
    const rows = await (this.prisma).corr2ResourceSubscription.findMany({
      where: {
        resourceType,
        resourceId: resourceId ?? null,
        isActive: true,
      },
      include: { channels: true },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findAll(filter?: SubscriptionFilter): Promise<ResourceSubscription[]> {
    const rows = await (this.prisma).corr2ResourceSubscription.findMany({
      where: this.buildWhere(filter),
      include: { channels: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findPaged(filter?: BaseFilter<SubscriptionFilter>): Promise<Page<ResourceSubscription>> {
    const where = this.buildWhere(filter?.props);
    const pageIndex = filter?.pageIndex ?? 0;
    const pageSize = filter?.pageSize ?? 50;
    const [rows, total] = await Promise.all([
      (this.prisma).corr2ResourceSubscription.findMany({
        where,
        include: { channels: true },
        orderBy: { createdAt: 'desc' },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      (this.prisma).corr2ResourceSubscription.count({ where }),
    ]);
    return new Page(rows.map((r: any) => this.toDomain(r)), total, pageIndex, pageSize);
  }

  async count(filter: SubscriptionFilter): Promise<number> {
    return (this.prisma).corr2ResourceSubscription.count({
      where: this.buildWhere(filter),
    });
  }

  async updateEmailForUser(userId: string, newEmail: string): Promise<void> {
    await (this.prisma).corr2ResourceSubscription.updateMany({
      where: { userId },
      data: { userEmail: newEmail, updatedAt: new Date() },
    });
  }

  async deleteInactiveBefore(date: Date): Promise<number> {
    const result = await (this.prisma).corr2ResourceSubscription.deleteMany({
      where: { isActive: false, updatedAt: { lt: date } },
    });
    return result.count;
  }

  private buildWhere(filter?: SubscriptionFilter): Record<string, any> {
    if (!filter) return {};
    return {
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.roleName ? { roleName: filter.roleName } : {}),
      ...(filter.resourceType ? { resourceType: filter.resourceType } : {}),
      ...(filter.resourceId !== undefined ? { resourceId: filter.resourceId } : {}),
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.subscriberType ? { subscriberType: filter.subscriberType } : {}),
    };
  }

  private toDomain(row: any): ResourceSubscription {
    const channels: SubscriptionChannel[] = (row.channels ?? []).map(
      (c: any) =>
        new SubscriptionChannel(c.id, c.subscriptionId, c.channel as ChannelType, {
          enabled: c.enabled,
          emailRole: (c.emailRole as EmailRole) ?? undefined,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }),
    );
    return new ResourceSubscription(
      row.id,
      row.subscriberType as SubscriberType,
      row.resourceType,
      row.subscribedVia as SubscribedVia,
      {
        userId: row.userId ?? undefined,
        userEmail: row.userEmail ?? undefined,
        userName: row.userName ?? undefined,
        roleName: row.roleName ?? undefined,
        resourceId: row.resourceId ?? undefined,
        isActive: row.isActive,
        channels,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    );
  }
}
