import { Prisma } from '../prisma/client';
import { Activity } from '../../../internal/project/domain/aggregates/activity/activity.aggregate';
import { ActivityPriority, ActivityScale, ActivityStatus, ActivityType } from '../../../internal/project/domain/enums/activity.enum';
import { MapperUtils } from '../finance/mapper-utils';

export type ActivityPersistence = Prisma.ActivityGetPayload<{
  include: { project: true; assignee: true; organizer: true; parentActivity: true };
}>;

export class ActivityPrismaMapper {
  static toDomain(p: ActivityPersistence | null): Activity | null {
    if (!p) return null;
    return new Activity(
      p.id,
      p.projectId,
      p.name,
      p.scale as ActivityScale,
      p.type as ActivityType,
      p.status as ActivityStatus,
      p.priority as ActivityPriority,
      MapperUtils.nullToUndefined(p.description),
      MapperUtils.nullToUndefined(p.startDate),
      MapperUtils.nullToUndefined(p.endDate),
      MapperUtils.nullToUndefined(p.actualStartDate),
      MapperUtils.nullToUndefined(p.actualEndDate),
      MapperUtils.nullToUndefined(p.location),
      MapperUtils.nullToUndefined(p.venue),
      MapperUtils.nullToUndefined(p.assignedTo),
      MapperUtils.nullToUndefined(p.organizerId),
      MapperUtils.nullToUndefined(p.parentActivityId),
      MapperUtils.nullToUndefined(p.expectedParticipants),
      MapperUtils.nullToUndefined(p.actualParticipants),
      MapperUtils.nullToUndefined(p.estimatedCost) !== undefined ? Number(p.estimatedCost) : undefined,
      MapperUtils.nullToUndefined(p.actualCost) !== undefined ? Number(p.actualCost) : undefined,
      MapperUtils.nullToUndefined(p.currency),
      p.tags,
      p.metadata as Record<string, unknown> | undefined,
      p.createdAt,
      p.updatedAt,
    );
  }

  static toCreate(domain: Activity): Prisma.ActivityUncheckedCreateInput {
    return {
      id: domain.id,
      projectId: domain.projectId,
      name: domain.name,
      description: MapperUtils.undefinedToNull(domain.description),
      scale: domain.scale,
      type: domain.type,
      status: domain.status,
      priority: domain.priority,
      startDate: MapperUtils.undefinedToNull(domain.startDate),
      endDate: MapperUtils.undefinedToNull(domain.endDate),
      actualStartDate: MapperUtils.undefinedToNull(domain.actualStartDate),
      actualEndDate: MapperUtils.undefinedToNull(domain.actualEndDate),
      location: MapperUtils.undefinedToNull(domain.location),
      venue: MapperUtils.undefinedToNull(domain.venue),
      assignedTo: MapperUtils.undefinedToNull(domain.assignedTo),
      organizerId: MapperUtils.undefinedToNull(domain.organizerId),
      parentActivityId: MapperUtils.undefinedToNull(domain.parentActivityId),
      expectedParticipants: MapperUtils.undefinedToNull(domain.expectedParticipants),
      actualParticipants: MapperUtils.undefinedToNull(domain.actualParticipants),
      estimatedCost: MapperUtils.undefinedToNull(domain.estimatedCost),
      actualCost: MapperUtils.undefinedToNull(domain.actualCost),
      currency: MapperUtils.undefinedToNull(domain.currency),
      tags: domain.tags,
      metadata: domain.metadata as Prisma.InputJsonValue,
      version: 0,
    };
  }

  static toUpdate(domain: Activity): Prisma.ActivityUncheckedUpdateInput {
    return {
      name: domain.name,
      description: MapperUtils.undefinedToNull(domain.description),
      type: domain.type,
      status: domain.status,
      priority: domain.priority,
      startDate: MapperUtils.undefinedToNull(domain.startDate),
      endDate: MapperUtils.undefinedToNull(domain.endDate),
      actualStartDate: MapperUtils.undefinedToNull(domain.actualStartDate),
      actualEndDate: MapperUtils.undefinedToNull(domain.actualEndDate),
      location: MapperUtils.undefinedToNull(domain.location),
      venue: MapperUtils.undefinedToNull(domain.venue),
      assignedTo: MapperUtils.undefinedToNull(domain.assignedTo),
      organizerId: MapperUtils.undefinedToNull(domain.organizerId),
      parentActivityId: MapperUtils.undefinedToNull(domain.parentActivityId),
      expectedParticipants: MapperUtils.undefinedToNull(domain.expectedParticipants),
      actualParticipants: MapperUtils.undefinedToNull(domain.actualParticipants),
      estimatedCost: MapperUtils.undefinedToNull(domain.estimatedCost),
      actualCost: MapperUtils.undefinedToNull(domain.actualCost),
      currency: MapperUtils.undefinedToNull(domain.currency),
      tags: domain.tags,
      metadata: domain.metadata as Prisma.InputJsonValue,
      updatedAt: new Date(),
    };
  }
}
