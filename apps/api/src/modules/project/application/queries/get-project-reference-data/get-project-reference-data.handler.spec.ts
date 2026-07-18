import { GetProjectReferenceDataHandler } from './get-project-reference-data.handler';
import { GetProjectReferenceDataQuery } from './get-project-reference-data.query';

describe('GetProjectReferenceDataHandler', () => {
  it('returns reference data from port', async () => {
    const port = {
      getProjectReferenceData: jest.fn().mockResolvedValue({
        projectCategories: [{ key: 'HEALTH', value: 'Health' }],
        projectStatuses: [],
        projectPhases: [],
        activityScales: [],
        activityTypes: [],
        activityStatuses: [],
        activityPriorities: [],
      }),
    };
    const handler = new GetProjectReferenceDataHandler(port as any);
    const result = await handler.execute(new GetProjectReferenceDataQuery());
    expect(result.projectCategories).toHaveLength(1);
  });
});
