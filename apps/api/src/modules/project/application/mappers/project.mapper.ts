import { Project } from '../../domain/aggregates/project/project.aggregate';
import { ProjectDetailDto } from '../dtos/project.dto';

export class ProjectMapper {
  static toDto(project: Project): ProjectDetailDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      code: project.code,
      category: project.category,
      status: project.status,
      phase: project.phase,
      startDate: project.startDate,
      endDate: project.endDate,
      actualEndDate: project.actualEndDate,
      budget: project.budget,
      spentAmount: project.spentAmount,
      currency: project.currency,
      location: project.location,
      targetBeneficiaryCount: project.targetBeneficiaryCount,
      actualBeneficiaryCount: project.actualBeneficiaryCount,
      managerId: project.managerId,
      sponsorId: project.sponsorId,
      tags: project.tags,
      metadata: project.metadata,
      createdAt: project.createdAt!,
      updatedAt: project.updatedAt!,
      nextStatus: project.nextStatus,
    };
  }
}
