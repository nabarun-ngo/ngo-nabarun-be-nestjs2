import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import type { AuthUser } from '@ce/nestjs-shared-auth';
import { CreateMeetingCommand } from '../../application/commands/create-meeting/create-meeting.command';
import { UpdateMeetingCommand } from '../../application/commands/update-meeting/update-meeting.command';
import { DeleteMeetingCommand } from '../../application/commands/delete-meeting/delete-meeting.command';
import { ListMeetingsQuery } from '../../application/queries/list-meetings/list-meetings.query';
import { GetMeetingByIdQuery } from '../../application/queries/get-meeting-by-id/get-meeting-by-id.query';
import { MeetingMapper } from '../../application/mappers/meeting.mapper';
import {
  CreateMeetingDto,
  MeetingDetailDto,
  MeetingDetailFilterDto,
  MeetingListResponseDto,
  UpdateMeetingDto,
} from '../../application/dtos/meeting.dto';

@ApiTags('Meeting')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('meetings')
export class MeetingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:meeting')
  async createMeeting(@Body() dto: CreateMeetingDto, @CurrentUser() user: AuthUser): Promise<MeetingDetailDto> {
    const meeting = await this.commandBus.execute(new CreateMeetingCommand({ ...dto, createdById: user.userId }));
    return MeetingMapper.toDto(meeting);
  }

  @Get('list')
  @RequirePermissions('read:meeting')
  listMeetings(
    @CurrentUser() user: AuthUser,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: MeetingDetailFilterDto,
  ): Promise<MeetingListResponseDto> {
    return this.queryBus.execute(
      new ListMeetingsQuery({ ...filter, participantId: filter?.participantId ?? user.userId }, pageIndex, pageSize),
    );
  }

  @Get(':id')
  @RequirePermissions('read:meeting')
  getMeetingById(@Param('id') id: string): Promise<MeetingDetailDto> {
    return this.queryBus.execute(new GetMeetingByIdQuery(id));
  }

  @Put('update/:id')
  @RequirePermissions('update:meeting')
  async updateMeeting(@Param('id') id: string, @Body() dto: UpdateMeetingDto): Promise<MeetingDetailDto> {
    const meeting = await this.commandBus.execute(new UpdateMeetingCommand({ id, ...dto }));
    return MeetingMapper.toDto(meeting);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('delete:meeting')
  deleteMeeting(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteMeetingCommand(id));
  }
}
