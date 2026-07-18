import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { Goal } from '../../../domain/aggregates/goal/goal.aggregate';
import { IGoalRepository } from '../../../domain/repositories/goal.repository';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { CreateGoalCommand } from './create-goal.command';
@CommandHandler(CreateGoalCommand) @Injectable()
export class CreateGoalHandler implements ICommandHandler<CreateGoalCommand, Goal> {
  constructor(@Inject(IGoalRepository) private readonly goalRepo: IGoalRepository, @Inject(IProjectRepository) private readonly projectRepo: IProjectRepository) {}
  async execute({ params }: CreateGoalCommand): Promise<Goal> {
    const project = await this.projectRepo.findById(params.projectId as string);
    if (!project?.isActive()) throw new BusinessException('Project not found or inactive');
    return this.goalRepo.create(Goal.create(params as any));
  }
}