import { EventBus } from '@nestjs/cqrs';
import { CreateActivityHandler } from './create-activity.handler';
import { CreateActivityCommand } from './create-activity.command';
import { ActivityPriority, ActivityScale, ActivityType } from '../../../domain/enums/activity.enum';
import { ProjectCategory, ProjectStatus } from '../../../domain/enums/project.enum';
import { Activity } from '../../../domain/aggregates/activity/activity.aggregate';
import { Project } from '../../../domain/aggregates/project/project.aggregate';

describe('CreateActivityHandler', () => {
  it('creates activity for active project', async () => {
    const project = Project.create({
      name: 'P',
      description: 'D',
      code: 'PRJ-003',
      category: ProjectCategory.HEALTH,
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-01-01'),
      budget: 1000,
      currency: 'INR',
      managerId: 'mgr-1',
    });
    const activity = Activity.create({
      projectId: project.id,
      name: 'Workshop',
      scale: ActivityScale.ACTIVITY,
      type: ActivityType.WORKSHOP,
      priority: ActivityPriority.MEDIUM,
    });
    const activityRepository = { findById: jest.fn(), create: jest.fn().mockResolvedValue(activity) };
    const projectRepository = { findById: jest.fn().mockResolvedValue(project) };
    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;
    const handler = new CreateActivityHandler(activityRepository as any, projectRepository as any, eventBus);
    const result = await handler.execute(
      new CreateActivityCommand({
        projectId: project.id,
        name: 'Workshop',
        scale: ActivityScale.ACTIVITY,
        type: ActivityType.WORKSHOP,
        priority: ActivityPriority.MEDIUM,
      }),
    );
    expect(result.name).toBe('Workshop');
    expect(activityRepository.create).toHaveBeenCalled();
  });
});
