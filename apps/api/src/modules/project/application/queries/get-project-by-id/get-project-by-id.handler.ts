import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { ProjectDetailDto } from '../../dtos/project.dto';
import { ProjectMapper } from '../../mappers/project.mapper';
import { GetProjectByIdQuery } from './get-project-by-id.query';

@QueryHandler(GetProjectByIdQuery)
@Injectable()
export class GetProjectByIdHandler implements IQueryHandler<GetProjectByIdQuery, ProjectDetailDto> {
  constructor(@Inject(IProjectRepository) private readonly repo: IProjectRepository) { }

  async execute(query: GetProjectByIdQuery): Promise<ProjectDetailDto> {
    const project = await this.repo.findById(query.id);
    if (!project) throw new BusinessException('Project not found with id ' + query.id);
    return ProjectMapper.toDto(project);
  }
}
