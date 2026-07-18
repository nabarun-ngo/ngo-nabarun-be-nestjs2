import { Prisma } from '../prisma/client';
import { Goal } from '../../../modules/project/domain/aggregates/goal/goal.aggregate';
import { GoalPriority, GoalStatus } from '../../../modules/project/domain/enums/goal.enum';
import { MapperUtils } from '../finance/mapper-utils';
export class GoalPrismaMapper {
  static toDomain(p: Prisma.GoalGetPayload<object> | null): Goal | null {
    if (!p) return null;
    return Goal.rehydrate(p.id, {
      projectId: p.projectId, title: p.title, description: MapperUtils.nullToUndefined(p.description),
      targetValue: p.targetValue != null ? Number(p.targetValue) : undefined,
      targetUnit: MapperUtils.nullToUndefined(p.targetUnit), currentValue: Number(p.currentValue),
      deadline: MapperUtils.nullToUndefined(p.deadline), priority: p.priority as GoalPriority,
      status: p.status as GoalStatus, weight: p.weight != null ? Number(p.weight) : undefined,
      createdAt: p.createdAt, updatedAt: p.updatedAt,
    });
  }
  static toCreate(d: Goal): Prisma.GoalUncheckedCreateInput {
    return {
      id: d.id, projectId: d.projectId, title: d.title, description: MapperUtils.undefinedToNull(d.description),
      targetValue: MapperUtils.undefinedToNull(d.targetValue), targetUnit: MapperUtils.undefinedToNull(d.targetUnit),
      currentValue: d.currentValue, deadline: MapperUtils.undefinedToNull(d.deadline), priority: d.priority,
      status: d.status, weight: MapperUtils.undefinedToNull(d.weight), version: 0
    };
  }
  static toUpdate(d: Goal): Prisma.GoalUncheckedUpdateInput {
    return {
      title: d.title, description: MapperUtils.undefinedToNull(d.description),
      targetValue: MapperUtils.undefinedToNull(d.targetValue), targetUnit: MapperUtils.undefinedToNull(d.targetUnit),
      currentValue: d.currentValue, deadline: MapperUtils.undefinedToNull(d.deadline), priority: d.priority,
      status: d.status, weight: MapperUtils.undefinedToNull(d.weight), updatedAt: new Date()
    };
  }
}
