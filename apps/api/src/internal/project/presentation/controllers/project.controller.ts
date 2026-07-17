import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import { CreateProjectCommand } from '../../application/commands/create-project/create-project.command';
import { UpdateProjectCommand } from '../../application/commands/update-project/update-project.command';
import { CreateActivityCommand } from '../../application/commands/create-activity/create-activity.command';
import { UpdateActivityCommand } from '../../application/commands/update-activity/update-activity.command';
import { LinkExpenseToActivityCommand } from '../../application/commands/link-expense-to-activity/link-expense-to-activity.command';
import { ListProjectsQuery } from '../../application/queries/list-projects/list-projects.query';
import { GetProjectByIdQuery } from '../../application/queries/get-project-by-id/get-project-by-id.query';
import { ListActivitiesQuery } from '../../application/queries/list-activities/list-activities.query';
import { GetProjectReferenceDataQuery } from '../../application/queries/get-project-reference-data/get-project-reference-data.query';
import { GetProjectProgressQuery } from '../../application/queries/get-project-progress/get-project-progress.query';
import { GetProjectDashboardQuery } from '../../application/queries/get-project-dashboard/get-project-dashboard.query';
import { ProjectMapper } from '../../application/mappers/project.mapper';
import { ActivityMapper } from '../../application/mappers/activity.mapper';
import {
  CreateProjectDto,
  ProjectDetailDto,
  ProjectDetailFilterDto,
  ProjectRefDataDto,
  UpdateProjectDto,
} from '../../application/dtos/project.dto';
import {
  ActivityDetailDto,
  ActivityDetailFilterDto,
  CreateActivityDto,
  LinkExpenseToActivityDto,
  UpdateActivityDto,
} from '../../application/dtos/activity.dto';
import { ProjectListResponseDto } from '../../application/dtos/project-list.dto';
import { ActivityListResponseDto } from '../../application/dtos/activity-list.dto';

@ApiTags('Project')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get('static/referenceData')
  @RequirePermissions('read:project')
  getReferenceData(): Promise<ProjectRefDataDto> {
    return this.queryBus.execute(new GetProjectReferenceDataQuery());
  }

  @Get()
  @RequirePermissions('read:project')
  listProjects(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ProjectDetailFilterDto,
  ): Promise<ProjectListResponseDto> {
    return this.queryBus.execute(new ListProjectsQuery(filter ?? {}, pageIndex, pageSize));
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:project')
  async createProject(@Body() dto: CreateProjectDto): Promise<ProjectDetailDto> {
    const project = await this.commandBus.execute(new CreateProjectCommand(dto));
    return ProjectMapper.toDto(project);
  }

  @Get(':id/progress')
  @RequirePermissions('read:project')
  getProgress(@Param('id') id: string) {
    return this.queryBus.execute(new GetProjectProgressQuery(id));
  }

  @Get(':id/dashboard')
  @RequirePermissions('read:project')
  getDashboard(@Param('id') id: string) {
    return this.queryBus.execute(new GetProjectDashboardQuery(id));
  }

  @Get(':id')
  @RequirePermissions('read:project')
  getProjectById(@Param('id') id: string): Promise<ProjectDetailDto> {
    return this.queryBus.execute(new GetProjectByIdQuery(id));
  }

  @Patch(':id/update')
  @RequirePermissions('update:project')
  async updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto): Promise<ProjectDetailDto> {
    const project = await this.commandBus.execute(new UpdateProjectCommand({ id, ...dto }));
    return ProjectMapper.toDto(project);
  }

  @Get(':id/activities')
  @RequirePermissions('read:activity')
  listActivities(
    @Param('id') id: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ActivityDetailFilterDto,
  ): Promise<ActivityListResponseDto> {
    return this.queryBus.execute(new ListActivitiesQuery(id, filter ?? {}, pageIndex, pageSize));
  }

  @Post(':id/activity')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:activity')
  async createActivity(@Param('id') id: string, @Body() dto: CreateActivityDto): Promise<ActivityDetailDto> {
    const activity = await this.commandBus.execute(new CreateActivityCommand({ ...dto, projectId: id }));
    return ActivityMapper.toDto(activity);
  }

  @Patch(':id/activity/:activityId')
  @RequirePermissions('update:activity')
  async updateActivity(
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityDetailDto> {
    const activity = await this.commandBus.execute(new UpdateActivityCommand({ activityId, ...dto }));
    return ActivityMapper.toDto(activity);
  }

  @Post(':id/activity/:activityId/link-expense')
  @RequirePermissions('update:activity')
  @HttpCode(HttpStatus.NO_CONTENT)
  linkExpense(@Param('activityId') activityId: string, @Body() dto: LinkExpenseToActivityDto): Promise<void> {
    return this.commandBus.execute(new LinkExpenseToActivityCommand({ activityId, expenseId: dto.expenseId }));
  }
}
