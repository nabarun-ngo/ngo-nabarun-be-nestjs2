import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Goal } from '../../../domain/aggregates/goal/goal.aggregate';
import { IGoalRepository } from '../../../domain/repositories/goal.repository';
import { UpdateGoalCommand } from './update-goal.command';
@CommandHandler(UpdateGoalCommand) @Injectable()
export class UpdateGoalHandler implements ICommandHandler<UpdateGoalCommand, Goal> {
  constructor(@Inject(IGoalRepository) private readonly repo: IGoalRepository) { }
  async execute({ params }: UpdateGoalCommand): Promise<Goal> {
    const goal = await this.repo.findById(params.id as string);
    if (!goal) throw new BusinessException('Goal not found');
    const { id, ...rest } = params; goal.update(rest as any);
    return this.repo.update(id as string, goal);
  }
}