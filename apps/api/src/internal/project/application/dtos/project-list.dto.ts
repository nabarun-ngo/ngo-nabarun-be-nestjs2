import { ProjectDetailDto } from './project.dto';

export class ProjectListResponseDto {
  items!: ProjectDetailDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}
