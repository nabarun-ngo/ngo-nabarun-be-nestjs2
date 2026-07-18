import { UpdateProjectHandler } from './update-project.handler';
import { UpdateProjectCommand } from './update-project.command';
import { ProjectCategory, ProjectStatus } from '../../../domain/enums/project.enum';
import { Project } from '../../../domain/aggregates/project/project.aggregate';

describe('UpdateProjectHandler', () => {
  it('updates an existing project', async () => {
    const project = Project.create({
      name: 'Old',
      description: 'Desc',
      code: 'PRJ-002',
      category: ProjectCategory.HEALTH,
      startDate: new Date('2026-01-01'),
      budget: 1000,
      currency: 'INR',
      managerId: 'mgr-1',
    });
    const repo = {
      findById: jest.fn().mockResolvedValue(project),
      update: jest.fn().mockImplementation((_id, p) => Promise.resolve(p)),
    };
    const handler = new UpdateProjectHandler(repo as any);
    const result = await handler.execute(
      new UpdateProjectCommand({ id: project.id, name: 'New', status: ProjectStatus.ACTIVE }),
    );
    expect(result.name).toBe('New');
    expect(result.status).toBe(ProjectStatus.ACTIVE);
  });
});
