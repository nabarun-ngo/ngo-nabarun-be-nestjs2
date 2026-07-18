import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MeetingType } from '../../domain/enums/meeting-type.enum';

export class MeetingParticipantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiProperty() @IsNotEmpty() @IsString() email!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() attended?: string;
}

export class MeetingAgendaItemDto {
  @ApiProperty() @IsNotEmpty() @IsString() agenda!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() outcomes?: string;
}

export class CreateMeetingDto {
  @ApiProperty() @IsNotEmpty() @IsString() summary!: string;
  @ApiProperty({ enum: MeetingType }) @IsNotEmpty() @IsEnum(MeetingType) type!: MeetingType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [MeetingAgendaItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetingAgendaItemDto)
  agenda?: MeetingAgendaItemDto[];

  @ApiProperty() @IsNotEmpty() @IsString() startTime!: string;
  @ApiProperty() @IsNotEmpty() @IsString() endTime!: string;

  @ApiProperty({ type: [MeetingParticipantDto] })
  @ValidateNested({ each: true })
  @Type(() => MeetingParticipantDto)
  attendees!: MeetingParticipantDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

export class UpdateMeetingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ type: [MeetingAgendaItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetingAgendaItemDto)
  agenda?: MeetingAgendaItemDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() outcomes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endTime?: string;

  @ApiPropertyOptional({ type: [MeetingParticipantDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetingParticipantDto)
  attendees?: MeetingParticipantDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cancelEvent?: boolean = false;
}

export class MeetingDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: MeetingType }) type!: MeetingType;
  @ApiProperty() summary!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional({ type: [MeetingAgendaItemDto] }) agenda?: MeetingAgendaItemDto[];
  @ApiPropertyOptional() outcomes?: string;
  @ApiPropertyOptional() location?: string;
  @ApiProperty() startTime!: Date;
  @ApiProperty() endTime!: Date;
  @ApiPropertyOptional({ type: [MeetingParticipantDto] }) attendees?: MeetingParticipantDto[];
  @ApiPropertyOptional() meetLink?: string;
  @ApiPropertyOptional() calendarLink?: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() hostEmail?: string;
  @ApiPropertyOptional() createdById?: string;
  @ApiPropertyOptional() recordingUrl?: string;
  @ApiPropertyOptional() meetingNotes?: string;
  @ApiPropertyOptional() meetingActionItems?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class MeetingDetailFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() createdById?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() participantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() participantEmail?: string;
}

export class MeetingListResponseDto {
  @ApiProperty({ type: [MeetingDetailDto] }) items!: MeetingDetailDto[];
  @ApiProperty() total!: number;
  @ApiProperty() pageIndex!: number;
  @ApiProperty() pageSize!: number;
}
