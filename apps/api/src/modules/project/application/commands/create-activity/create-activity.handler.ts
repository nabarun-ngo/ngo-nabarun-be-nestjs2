import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Activity } from '../../../domain/aggregates/activity/activity.aggregate';
import { IActivityRepository } from '../../../domain/repositories/activity.repository';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { CreateActivityCommand } from './create-activity.command';

@CommandHandler(CreateActivityCommand)
@Injectable()
export class CreateActivityHandler implements ICommandHandler<CreateActivityCommand, Activity> {
  constructor(
    @Inject(IActivityRepository) private readonly activityRepository: IActivityRepository,
    @Inject(IProjectRepository) private readonly projectRepository: IProjectRepository,
    private readonly eventBus: EventBus,
  ) { }

  async execute({ params }: CreateActivityCommand): Promise<Activity> {
    const project = await this.projectRepository.findById(params.projectId);
    if (!project) throw new BusinessException('Project not found');
    if (!project.isActive()) throw new BusinessException('Cannot add activity to inactive project');
    if (params.parentActivityId) {
      const parent = await this.activityRepository.findById(params.parentActivityId);
      if (!parent) throw new BusinessException('Parent activity not found');
      if (parent.projectId !== params.projectId) {
        throw new BusinessException('Parent activity must belong to the same project');
      }
    }
    const activity = Activity.create(params);
    const saved = await this.activityRepository.create(activity);
    const events = [...saved.domainEvents];
    saved.clearEvents();
    this.eventBus.publishAll(events);
    return saved;
  }
}
