import { ActivityDetailFilterDto } from '../../dtos/activity.dto';

export class ListActivitiesQuery {
  constructor(
    public readonly projectId: string,
    public readonly filter: ActivityDetailFilterDto = {},
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
  ) {}
}
