import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiAutoResponse, SuccessResponse } from '@ce/nestjs-shared-core';
import { CurrentUser, RequirePermissions, type AuthUser } from '@ce/nestjs-shared-auth';
import { WorkflowRequesterType } from '../../domain/models/workflow-requester';
import { StartWorkflowCommand } from '../../application/commands/start-workflow/start-workflow.command';
import { CompleteUserTaskCommand } from '../../application/commands/complete-user-task/complete-user-task.command';
import { ClaimTaskCommand } from '../../application/commands/claim-task/claim-task.command';
import { DelegateTaskCommand } from '../../application/commands/delegate-task/delegate-task.command';
import { CancelWorkflowCommand } from '../../application/commands/cancel-workflow/cancel-workflow.command';
import { GetWorkflowInstanceQuery } from '../../application/queries/get-workflow-instance/get-workflow-instance.query';
import { GetMyInboxQuery } from '../../application/queries/get-my-inbox/get-my-inbox.query';
import { GetWorkflowTimelineQuery } from '../../application/queries/get-workflow-timeline/get-workflow-timeline.query';
import {
  CancelWorkflowRequestDto,
  CompleteUserTaskRequestDto,
  DelegateTaskRequestDto,
  StartWorkflowRequestDto,
  WorkflowInboxTaskDto,
  WorkflowInstanceDto,
  WorkflowTimelineEntryDto,
} from '../../application/dtos/workflow.dtos';

@ApiTags(WorkflowController.name)
@Controller('workflows')
@ApiSecurity('api-key')
@ApiBearerAuth('jwt')
export class WorkflowController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('create:workflow')
  @ApiOperation({ summary: 'Start a new workflow instance' })
  @ApiAutoResponse(WorkflowInstanceDto, { status: 201, wrapInSuccessResponse: true })
  async start(
    @Body() dto: StartWorkflowRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new StartWorkflowCommand({
          definitionId: dto.definitionId,
          definitionVersion: dto.definitionVersion,
          name: dto.name,
          description: dto.description,
          context: dto.context,
          requester: { type: WorkflowRequesterType.Internal, id: user.userId ?? null },
          initiatedById: user.userId ?? null,
          initiatedForId: dto.initiatedForId,
          idempotencyKey: dto.idempotencyKey,
        }),
      ),
    );
  }

  @Get('inbox/me')
  @RequirePermissions('read:task')
  @ApiOperation({ summary: 'List open workflow tasks for the current user' })
  @ApiAutoResponse(WorkflowInboxTaskDto, { wrapInSuccessResponse: true, isArray: true })
  async getMyInbox(@CurrentUser() user: AuthUser) {
    return new SuccessResponse(
      await this.queryBus.execute(new GetMyInboxQuery(user.userId!)),
    );
  }

  @Get(':instanceId')
  @RequirePermissions('read:workflow')
  @ApiOperation({ summary: 'Get workflow instance by id' })
  @ApiAutoResponse(WorkflowInstanceDto, { wrapInSuccessResponse: true })
  async getInstance(@Param('instanceId') instanceId: string) {
    return new SuccessResponse(
      await this.queryBus.execute(new GetWorkflowInstanceQuery(instanceId)),
    );
  }

  @Post(':instanceId/cancel')
  @RequirePermissions('update:workflow')
  @ApiOperation({ summary: 'Cancel a running workflow instance' })
  @ApiAutoResponse(WorkflowInstanceDto, { wrapInSuccessResponse: true })
  async cancel(
    @Param('instanceId') instanceId: string,
    @Body() dto: CancelWorkflowRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new CancelWorkflowCommand({
          instanceId,
          actorId: user.userId ?? null,
          remarks: dto.remarks,
        }),
      ),
    );
  }

  @Post('tasks/:taskId/claim')
  @RequirePermissions('update:task')
  @ApiOperation({ summary: 'Claim a workflow task' })
  @ApiAutoResponse(WorkflowInstanceDto, { wrapInSuccessResponse: true })
  async claimTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new ClaimTaskCommand({
          taskId,
          userId: user.userId!,
          userPermissions: user.permissions ?? [],
        }),
      ),
    );
  }

  @Post('tasks/:taskId/complete')
  @RequirePermissions('update:task')
  @ApiOperation({ summary: 'Complete a user task and advance the workflow' })
  @ApiAutoResponse(WorkflowInstanceDto, { wrapInSuccessResponse: true })
  async completeTask(
    @Param('taskId') taskId: string,
    @Body() dto: CompleteUserTaskRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new CompleteUserTaskCommand({
          taskId,
          userId: user.userId!,
          userPermissions: user.permissions ?? [],
          formValues: dto.formValues,
          idempotencyKey: dto.idempotencyKey,
        }),
      ),
    );
  }

  @Post('tasks/:taskId/delegate')
  @RequirePermissions('update:task')
  @ApiOperation({ summary: 'Delegate a workflow task to another user' })
  @ApiAutoResponse(WorkflowInstanceDto, { wrapInSuccessResponse: true })
  async delegateTask(
    @Param('taskId') taskId: string,
    @Body() dto: DelegateTaskRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new DelegateTaskCommand({
          taskId,
          fromUserId: user.userId!,
          toUserId: dto.toUserId,
          userPermissions: user.permissions ?? [],
        }),
      ),
    );
  }

  @Get(':instanceId/timeline')
  @RequirePermissions('read:workflow')
  @ApiOperation({ summary: 'Get workflow event timeline' })
  @ApiAutoResponse(WorkflowTimelineEntryDto, { wrapInSuccessResponse: true, isArray: true })
  async getTimeline(
    @Param('instanceId') instanceId: string,
    @Query('fromSequence') fromSequence?: number,
    @Query('limit') limit?: number,
  ) {
    return new SuccessResponse(
      await this.queryBus.execute(
        new GetWorkflowTimelineQuery(instanceId, {
          fromSequence: fromSequence != null ? Number(fromSequence) : undefined,
          limit: limit != null ? Number(limit) : undefined,
        }),
      ),
    );
  }
}
