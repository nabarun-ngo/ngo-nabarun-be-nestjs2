import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../../../../../shared/persistence/prisma/client';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { GetProjectProgressQuery } from './get-project-progress.query';

export interface ProjectProgressDto {
  projectId: string;
  budgetUtilization: number;
  spentAmount: number;
  budget: number;
  beneficiaryCount: number;
  activityCount: number;
  goalCount: number;
  milestoneCount: number;
  openRiskCount: number;
}

@QueryHandler(GetProjectProgressQuery)
@Injectable()
export class GetProjectProgressHandler implements IQueryHandler<GetProjectProgressQuery, ProjectProgressDto> {
  constructor(
    @Inject(IProjectRepository) private readonly projectRepository: IProjectRepository,
    private readonly db: BasePrismaService<PrismaClient>,
  ) {}
  async execute(q: GetProjectProgressQuery): Promise<ProjectProgressDto> {
    const project = await this.projectRepository.findById(q.projectId);
    if (!project) throw new BusinessException('Project not found');
    const [activityCount, beneficiaryCount, goalCount, milestoneCount, openRiskCount] = await Promise.all([
      this.db.client.activity.count({ where: { projectId: q.projectId, deletedAt: null } }),
      this.db.client.beneficiary.count({ where: { projectId: q.projectId, deletedAt: null } }),
      this.db.client.goal.count({ where: { projectId: q.projectId, deletedAt: null } }),
      this.db.client.milestone.count({ where: { projectId: q.projectId, deletedAt: null } }),
      this.db.client.projectRisk.count({ where: { projectId: q.projectId, deletedAt: null, status: { not: 'CLOSED' } } }),
    ]);
    return {
      projectId: q.projectId,
      budgetUtilization: project.getBudgetUtilization(),
      spentAmount: project.spentAmount,
      budget: project.budget,
      beneficiaryCount,
      activityCount,
      goalCount,
      milestoneCount,
      openRiskCount,
    };
  }
}