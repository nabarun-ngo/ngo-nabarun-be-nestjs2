import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Project } from '../../../domain/aggregates/project/project.aggregate';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { UpdateProjectCommand } from './update-project.command';

@CommandHandler(UpdateProjectCommand)
@Injectable()
export class UpdateProjectHandler implements ICommandHandler<UpdateProjectCommand, Project> {
  constructor(@Inject(IProjectRepository) private readonly projectRepository: IProjectRepository) { }

  async execute({ params }: UpdateProjectCommand): Promise<Project> {
    const project = await this.projectRepository.findById(params.id);
    if (!project) throw new BusinessException('Project not found');
    project.update(params);
    if (params.status) project.updateStatus(params.status);
    if (params.phase) project.updatePhase(params.phase);
    return this.projectRepository.update(params.id, project);
  }
}
