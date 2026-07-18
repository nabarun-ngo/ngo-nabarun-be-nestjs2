import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import { CreateGoalCommand } from '../../application/commands/create-goal/create-goal.command';
import { UpdateGoalCommand } from '../../application/commands/update-goal/update-goal.command';
import { UpdateGoalProgressCommand } from '../../application/commands/update-goal-progress/update-goal-progress.command';
import { ListGoalsQuery } from '../../application/queries/list-goals/list-goals.query';
import { GoalMapper } from '../../application/mappers/goal.mapper';
import { CreateGoalDto, GoalDetailDto, GoalListResponseDto, UpdateGoalDto, UpdateGoalProgressDto } from '../../application/dtos/goal.dto';
@ApiTags('Goal') @ApiBearerAuth('jwt') @ApiSecurity('api-key') @UseGuards(UnifiedAuthGuard) @Controller('projects/:projectId/goals')
export class GoalController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get() @RequirePermissions('read:goal') list(@Param('projectId') projectId: string, @Query('pageIndex') pageIndex?: number, @Query('pageSize') pageSize?: number): Promise<GoalListResponseDto> {
    return this.queryBus.execute(new ListGoalsQuery(projectId, pageIndex, pageSize));
  }
  @Post('create') @HttpCode(HttpStatus.CREATED) @RequirePermissions('create:goal')
  async create(@Param('projectId') projectId: string, @Body() dto: CreateGoalDto): Promise<GoalDetailDto> {
    return GoalMapper.toDto(await this.commandBus.execute(new CreateGoalCommand({ ...dto, projectId })));
  }
  @Put(':id/update') @RequirePermissions('update:goal')
  async update(@Param('id') id: string, @Body() dto: UpdateGoalDto): Promise<GoalDetailDto> {
    return GoalMapper.toDto(await this.commandBus.execute(new UpdateGoalCommand({ id, ...dto })));
  }
  @Patch(':id/progress') @RequirePermissions('update:goal')
  async progress(@Param('id') id: string, @Body() dto: UpdateGoalProgressDto): Promise<GoalDetailDto> {
    return GoalMapper.toDto(await this.commandBus.execute(new UpdateGoalProgressCommand({ id, currentValue: dto.currentValue })));
  }
}
