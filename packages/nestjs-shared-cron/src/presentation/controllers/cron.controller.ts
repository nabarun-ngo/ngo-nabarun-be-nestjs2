import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiAutoResponse, ApiAutoVoidResponse, SuccessResponse } from '@nabarun-ngo/nestjs-shared-core';
import { RequirePermissions, UseApiKey } from '@nabarun-ngo/nestjs-shared-auth';
import { TriggerCronJobsCommand } from '../../application/commands/trigger-cron-jobs/trigger-cron-jobs.command';
import { CreateCronJobCommand } from '../../application/commands/create-cron-job/create-cron-job.command';
import { UpdateCronJobCommand } from '../../application/commands/update-cron-job/update-cron-job.command';
import { DeleteCronJobCommand } from '../../application/commands/delete-cron-job/delete-cron-job.command';
import { RunCronJobCommand } from '../../application/commands/run-cron-job/run-cron-job.command';
import { GetCronJobsQuery } from '../../application/queries/get-cron-jobs/get-cron-jobs.query';
import { CronJobDto, TriggerResultDto } from '../../application/dtos/cron.dtos';
import {
  CreateCronJobRequestDto,
  UpdateCronJobRequestDto,
} from '../../application/dtos/cron-request.dtos';

@ApiTags(Cron2Controller.name)
@Controller('cron')
@ApiSecurity('api-key')
@ApiBearerAuth('jwt')
export class Cron2Controller {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  /**
   * Called by the external cloud scheduler on each configured interval.
   * Evaluates all enabled job definitions and enqueues any that are due.
   */
  @Post('trigger')
  @UseApiKey()
  @RequirePermissions('update:cron')
  @ApiOperation({ summary: 'Evaluate schedules and enqueue due jobs (called by cloud scheduler)' })
  @ApiAutoResponse(TriggerResultDto, { wrapInSuccessResponse: true })
  async trigger(
    @Headers('x-cloudscheduler-scheduletime') scheduleTime?: string,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(new TriggerCronJobsCommand(scheduleTime)),
    );
  }

  @Get('jobs')
  @RequirePermissions('read:cron')
  @ApiOperation({ summary: 'List all cron job definitions with next-run time' })
  @ApiAutoResponse(CronJobDto, { wrapInSuccessResponse: true, isArray: true })
  async getJobs() {
    return new SuccessResponse(await this.queryBus.execute(new GetCronJobsQuery()));
  }

  @Post('jobs')
  @RequirePermissions('update:cron')
  @ApiOperation({ summary: 'Create or upsert a cron job definition' })
  @ApiAutoResponse(CronJobDto, { status: 201, wrapInSuccessResponse: true })
  async createJob(@Body() dto: CreateCronJobRequestDto) {
    return new SuccessResponse(
      await this.commandBus.execute(
        new CreateCronJobCommand({
          name: dto.name,
          description: dto.description,
          expression: dto.expression,
          handler: dto.handler,
          enabled: dto.enabled ?? true,
          inputData: dto.inputData,
        }),
      ),
    );
  }

  @Put('jobs/:name')
  @RequirePermissions('update:cron')
  @ApiOperation({ summary: 'Update a cron job definition' })
  @ApiAutoResponse(CronJobDto, { wrapInSuccessResponse: true })
  async updateJob(
    @Param('name') name: string,
    @Body() dto: UpdateCronJobRequestDto,
  ) {
    return new SuccessResponse(
      await this.commandBus.execute(new UpdateCronJobCommand(name, dto)),
    );
  }

  @Delete('jobs/:name')
  @RequirePermissions('update:cron')
  @ApiOperation({ summary: 'Delete a cron job definition' })
  @ApiAutoVoidResponse()
  async deleteJob(@Param('name') name: string) {
    await this.commandBus.execute(new DeleteCronJobCommand(name));
    return new SuccessResponse();
  }

  /**
   * Manually enqueue a specific job immediately, bypassing schedule evaluation.
   * Optionally supply a payload to override the job's stored inputData.
   */
  @Post('run/:name')
  @RequirePermissions('update:cron')
  @ApiOperation({ summary: 'Manually enqueue a specific job immediately' })
  @ApiAutoResponse(String, { wrapInSuccessResponse: true })
  @ApiBody({ type: Object, required: false })
  async runJob(
    @Param('name') name: string,
    @Body() body: Record<string, any>,
  ) {
    const result = await this.commandBus.execute(new RunCronJobCommand(name, body));
    return new SuccessResponse(result.id);
  }
}
