import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { Goal } from '../../../domain/aggregates/goal/goal.aggregate';
import { IGoalRepository } from '../../../domain/repositories/goal.repository';
import { UpdateGoalProgressCommand } from './update-goal-progress.command';
@CommandHandler(UpdateGoalProgressCommand) @Injectable()
export class UpdateGoalProgressHandler implements ICommandHandler<UpdateGoalProgressCommand, Goal> {
  constructor(@Inject(IGoalRepository) private readonly repo: IGoalRepository) {}
  async execute({ params }: UpdateGoalProgressCommand): Promise<Goal> {
    const goal = await this.repo.findById(params.id as string);
    if (!goal) throw new BusinessException('Goal not found');
    goal.updateProgress(params.currentValue as number);
    return this.repo.update(params.id as string, goal);
  }
}