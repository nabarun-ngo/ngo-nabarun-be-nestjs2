import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiAutoResponse, SuccessResponse } from '@nabarun-ngo/nestjs-shared-core';
import { CurrentUser, RequirePermissions, type AuthUser } from '@nabarun-ngo/nestjs-shared-auth';
import { PublishDefinitionCommand } from '../../application/commands/publish-definition/publish-definition.command';
import { ForceSkipElementCommand } from '../../application/commands/force-skip-element/force-skip-element.command';
import { GetStuckWorkflowsQuery } from '../../application/queries/get-stuck-workflows/get-stuck-workflows.query';
import {
  ForceSkipElementRequestDto,
  PublishDefinitionRequestDto,
  WorkflowInstanceDto,
} from '../../application/dtos/workflow.dtos';
import type { WorkflowDefinition } from '../../dsl/workflow-definition.schema';

@ApiTags(WorkflowAdminController.name)
@Controller('workflows/admin')
@ApiSecurity('api-key')
@ApiBearerAuth('jwt')
export class WorkflowAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Post('definitions/publish')
  @RequirePermissions('manage:workflow-definitions')
  @ApiOperation({ summary: 'Validate and publish a workflow definition' })
  @ApiAutoResponse(Object, { wrapInSuccessResponse: true })
  async publishDefinition(@Body() dto: PublishDefinitionRequestDto) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new PublishDefinitionCommand(dto.definition),
      ) as WorkflowDefinition,
    );
  }

  @Get('stuck')
  @RequirePermissions('admin:workflows')
  @ApiOperation({ summary: 'List workflow instances that appear stuck' })
  @ApiAutoResponse(WorkflowInstanceDto, { wrapInSuccessResponse: true, isArray: true })
  async getStuckWorkflows(@Query('olderThanMinutes') olderThanMinutes?: number) {
    return new SuccessResponse(
      await this.queryBus.execute(
        new GetStuckWorkflowsQuery(
          olderThanMinutes != null ? Number(olderThanMinutes) : 60,
        ),
      ),
    );
  }

  @Post(':instanceId/force-skip')
  @RequirePermissions('admin:workflows')
  @ApiOperation({ summary: 'Force-skip the current workflow element (admin)' })
  @ApiAutoResponse(WorkflowInstanceDto, { wrapInSuccessResponse: true })
  async forceSkipElement(
    @Param('instanceId') instanceId: string,
    @Body() dto: ForceSkipElementRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new ForceSkipElementCommand({
          instanceId,
          elementId: dto.elementId,
          actorId: user.userId ?? null,
        }),
      ),
    );
  }
}
