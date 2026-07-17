import { ProjectDetailFilterDto } from '../../dtos/project.dto';

export class ListProjectsQuery {
  constructor(
    public readonly filter: ProjectDetailFilterDto = {},
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
  ) {}
}
