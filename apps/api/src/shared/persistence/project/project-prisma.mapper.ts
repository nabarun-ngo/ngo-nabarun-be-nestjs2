import { Prisma } from '../prisma/client';
import { Project } from '../../../modules/project/domain/aggregates/project/project.aggregate';
import { ProjectCategory, ProjectPhase, ProjectStatus } from '../../../modules/project/domain/enums/project.enum';
import { MapperUtils } from '../finance/mapper-utils';

export type ProjectPersistence = Prisma.ProjectGetPayload<{ include: { manager: true; sponsor: true } }>;

export class ProjectPrismaMapper {
  static toDomain(p: ProjectPersistence | null): Project | null {
    if (!p) return null;
    return new Project(
      p.id,
      p.name,
      p.description,
      p.code,
      p.category as ProjectCategory,
      p.status as ProjectStatus,
      p.phase as ProjectPhase,
      p.managerId,
      p.startDate,
      MapperUtils.nullToUndefined(p.endDate),
      MapperUtils.nullToUndefined(p.actualEndDate),
      Number(p.budget),
      Number(p.spentAmount),
      p.currency,
      MapperUtils.nullToUndefined(p.location),
      MapperUtils.nullToUndefined(p.targetBeneficiaryCount),
      MapperUtils.nullToUndefined(p.actualBeneficiaryCount),
      MapperUtils.nullToUndefined(p.sponsorId),
      p.tags,
      p.metadata as Record<string, unknown> | undefined,
      p.createdAt,
      p.updatedAt,
    );
  }

  static toCreate(domain: Project): Prisma.ProjectUncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      code: domain.code,
      category: domain.category,
      status: domain.status,
      phase: domain.phase,
      startDate: domain.startDate,
      endDate: MapperUtils.undefinedToNull(domain.endDate),
      actualEndDate: MapperUtils.undefinedToNull(domain.actualEndDate),
      budget: domain.budget,
      spentAmount: domain.spentAmount,
      currency: domain.currency,
      location: MapperUtils.undefinedToNull(domain.location),
      targetBeneficiaryCount: MapperUtils.undefinedToNull(domain.targetBeneficiaryCount),
      actualBeneficiaryCount: MapperUtils.undefinedToNull(domain.actualBeneficiaryCount),
      managerId: domain.managerId,
      sponsorId: MapperUtils.undefinedToNull(domain.sponsorId),
      tags: domain.tags,
      metadata: domain.metadata as Prisma.InputJsonValue,
      version: 0,
    };
  }

  static toUpdate(domain: Project): Prisma.ProjectUncheckedUpdateInput {
    return {
      name: domain.name,
      description: domain.description,
      category: domain.category,
      status: domain.status,
      phase: domain.phase,
      endDate: MapperUtils.undefinedToNull(domain.endDate),
      actualEndDate: MapperUtils.undefinedToNull(domain.actualEndDate),
      budget: domain.budget,
      spentAmount: domain.spentAmount,
      location: MapperUtils.undefinedToNull(domain.location),
      targetBeneficiaryCount: MapperUtils.undefinedToNull(domain.targetBeneficiaryCount),
      actualBeneficiaryCount: MapperUtils.undefinedToNull(domain.actualBeneficiaryCount),
      sponsorId: MapperUtils.undefinedToNull(domain.sponsorId),
      tags: domain.tags,
      metadata: domain.metadata as Prisma.InputJsonValue,
      updatedAt: new Date(),
    };
  }
}
