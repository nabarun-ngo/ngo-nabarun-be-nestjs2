import { Injectable, Logger } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import { IProjectReferenceDataPort, KeyValueOption } from '../../application/ports/project-reference-data.port';
import { ProjectReferenceDataPayloadSchema } from '../../project-reference-data.schema';

@Injectable()
export class ProjectReferenceDataAdapter implements IProjectReferenceDataPort {
  private static readonly NAMESPACE = 'project-reference-data';
  private readonly logger = new Logger(ProjectReferenceDataAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async getProjectReferenceData(): Promise<Record<string, KeyValueOption[]>> {
    const [
      projectCategories,
      projectStatuses,
      projectPhases,
      activityScales,
      activityTypes,
      activityStatuses,
      activityPriorities,
    ] = await Promise.all([
      this.loadItems('project-categories'),
      this.loadItems('project-statuses'),
      this.loadItems('project-phases'),
      this.loadItems('activity-scales'),
      this.loadItems('activity-types'),
      this.loadItems('activity-statuses'),
      this.loadItems('activity-priorities'),
    ]);
    return {
      projectCategories,
      projectStatuses,
      projectPhases,
      activityScales,
      activityTypes,
      activityStatuses,
      activityPriorities,
    };
  }

  private async loadItems(key: string): Promise<KeyValueOption[]> {
    const payload = await this.jsonStore.get(key, ProjectReferenceDataAdapter.NAMESPACE);
    if (!payload) return [];
    const parsed = ProjectReferenceDataPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid project-reference-data payload for ${key}`);
      return [];
    }
    return parsed.data.items;
  }
}
