import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Project } from '../../../domain/aggregates/project/project.aggregate';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { CreateProjectCommand } from './create-project.command';

@CommandHandler(CreateProjectCommand)
@Injectable()
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand, Project> {
  constructor(@Inject(IProjectRepository) private readonly projectRepository: IProjectRepository) { }

  async execute({ params }: CreateProjectCommand): Promise<Project> {
    const existing = await this.projectRepository.findByCode(params.code);
    if (existing) throw new BusinessException('Project with this code already exists');
    const project = Project.create(params);
    return this.projectRepository.create(project);
  }
}
