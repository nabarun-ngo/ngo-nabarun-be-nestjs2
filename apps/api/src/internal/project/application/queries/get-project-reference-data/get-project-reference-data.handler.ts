import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IProjectReferenceDataPort } from '../../ports/project-reference-data.port';
import { ProjectRefDataDto } from '../../dtos/project.dto';
import { GetProjectReferenceDataQuery } from './get-project-reference-data.query';

@QueryHandler(GetProjectReferenceDataQuery)
@Injectable()
export class GetProjectReferenceDataHandler implements IQueryHandler<GetProjectReferenceDataQuery, ProjectRefDataDto> {
  constructor(@Optional() @Inject(IProjectReferenceDataPort) private readonly port: IProjectReferenceDataPort) {}

  async execute(): Promise<ProjectRefDataDto> {
    const data = this.port ? await this.port.getProjectReferenceData() : {};
    return {
      projectCategories: data.projectCategories ?? [],
      projectStatuses: data.projectStatuses ?? [],
      projectPhases: data.projectPhases ?? [],
      activityScales: data.activityScales ?? [],
      activityTypes: data.activityTypes ?? [],
      activityStatuses: data.activityStatuses ?? [],
      activityPriorities: data.activityPriorities ?? [],
    };
  }
}
