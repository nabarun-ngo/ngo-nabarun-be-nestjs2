import { MeetingDetailFilterDto } from '../../dtos/meeting.dto';

export class ListMeetingsQuery {
  constructor(
    public readonly filter: MeetingDetailFilterDto = {},
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
  ) {}
}
