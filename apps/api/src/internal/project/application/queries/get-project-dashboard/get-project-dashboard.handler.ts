import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../../../../../shared/persistence/prisma/client';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { ProjectMapper } from '../../mappers/project.mapper';
import { GetProjectDashboardQuery } from './get-project-dashboard.query';
import { GetProjectProgressQuery } from '../get-project-progress/get-project-progress.query';
import { GetProjectProgressHandler, ProjectProgressDto } from '../get-project-progress/get-project-progress.handler';

export interface ProjectDashboardDto { project: ReturnType<typeof ProjectMapper.toDto>; progress: ProjectProgressDto; recentActivities: { id: string; name: string; status: string; scale: string }[]; upcomingMilestones: { id: string; name: string; targetDate: Date; status: string }[]; }

@QueryHandler(GetProjectDashboardQuery)
@Injectable()
export class GetProjectDashboardHandler implements IQueryHandler<GetProjectDashboardQuery, ProjectDashboardDto> {
  constructor(
    @Inject(IProjectRepository) private readonly projectRepository: IProjectRepository,
    private readonly db: BasePrismaService<PrismaClient>,
    private readonly progressHandler: GetProjectProgressHandler,
  ) {}
  async execute(q: GetProjectDashboardQuery): Promise<ProjectDashboardDto> {
    const project = await this.projectRepository.findById(q.projectId);
    if (!project) throw new BusinessException('Project not found');
    const [recentActivities, upcomingMilestones, progress] = await Promise.all([
      this.db.client.activity.findMany({ where: { projectId: q.projectId, deletedAt: null }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, name: true, status: true, scale: true } }),
      this.db.client.milestone.findMany({ where: { projectId: q.projectId, deletedAt: null, status: { not: 'ACHIEVED' } }, orderBy: { targetDate: 'asc' }, take: 5, select: { id: true, name: true, targetDate: true, status: true } }),
      this.progressHandler.execute(new GetProjectProgressQuery(q.projectId)),
    ]);
    return { project: ProjectMapper.toDto(project), progress, recentActivities, upcomingMilestones };
  }
}