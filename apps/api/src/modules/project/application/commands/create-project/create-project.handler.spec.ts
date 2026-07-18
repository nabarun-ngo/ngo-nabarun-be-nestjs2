import { CreateProjectHandler } from './create-project.handler';
import { CreateProjectCommand } from './create-project.command';
import { ProjectCategory } from '../../../domain/enums/project.enum';
import { Project } from '../../../domain/aggregates/project/project.aggregate';

describe('CreateProjectHandler', () => {
  it('creates a project when code is unique', async () => {
    const created = Project.create({
      name: 'Test',
      description: 'Desc',
      code: 'PRJ-001',
      category: ProjectCategory.HEALTH,
      startDate: new Date('2026-01-01'),
      budget: 1000,
      currency: 'INR',
      managerId: 'mgr-1',
    });
    const repo = {
      findByCode: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
    };
    const handler = new CreateProjectHandler(repo as any);
    const result = await handler.execute(
      new CreateProjectCommand({
        name: 'Test',
        description: 'Desc',
        code: 'PRJ-001',
        category: ProjectCategory.HEALTH,
        startDate: new Date('2026-01-01'),
        budget: 1000,
        currency: 'INR',
        managerId: 'mgr-1',
      }),
    );
    expect(repo.create).toHaveBeenCalled();
    expect(result.name).toBe('Test');
  });
});
