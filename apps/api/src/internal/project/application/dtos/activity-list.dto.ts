import { ActivityDetailDto } from './activity.dto';

export class ActivityListResponseDto {
  items!: ActivityDetailDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}
