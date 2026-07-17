import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';

export class FathomSpeakerDto {
  @ApiProperty()
  @IsString()
  display_name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  matched_calendar_invitee_email?: string;
}

export class FathomTranscriptDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => FathomSpeakerDto)
  speaker: FathomSpeakerDto;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsString()
  timestamp: string;
}

export class FathomDefaultSummaryDto {
  @ApiProperty()
  @IsString()
  template_name: string;

  @ApiProperty()
  @IsString()
  markdown_formatted: string;
}

export class FathomAssigneeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  team?: string;
}

export class FathomActionItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsBoolean()
  user_generated: boolean;

  @ApiProperty()
  @IsBoolean()
  completed: boolean;

  @ApiProperty()
  @IsString()
  recording_timestamp: string;

  @ApiProperty()
  @IsString()
  recording_playback_url: string;

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => FathomAssigneeDto)
  @IsOptional()
  assignee?: FathomAssigneeDto;
}

export class FathomCalendarInviteeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  matched_speaker_display_name?: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsBoolean()
  is_external: boolean;

  @ApiProperty()
  @IsString()
  email_domain: string;
}

export class FathomRecordedByDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  team?: string;

  @ApiProperty()
  @IsString()
  email_domain: string;
}

export class FathomCrmMatchesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  contacts?: unknown[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  companies?: unknown[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  deals?: unknown[];
}

/** Payload shape for Fathom's "New meeting content ready" webhook. */
export class FathomWebhookDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  meeting_title?: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  share_url: string;

  @ApiProperty()
  @IsDateString()
  created_at: string;

  @ApiProperty()
  @IsDateString()
  scheduled_start_time: string;

  @ApiProperty()
  @IsDateString()
  scheduled_end_time: string;

  @ApiProperty()
  @IsDateString()
  recording_start_time: string;

  @ApiProperty()
  @IsDateString()
  recording_end_time: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  calendar_invitees_domains_type?: string;

  @ApiProperty({ type: [FathomTranscriptDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FathomTranscriptDto)
  @IsOptional()
  transcript?: FathomTranscriptDto[];

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => FathomDefaultSummaryDto)
  @IsOptional()
  default_summary?: FathomDefaultSummaryDto;

  @ApiProperty({ type: [FathomActionItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FathomActionItemDto)
  @IsOptional()
  action_items?: FathomActionItemDto[];

  @ApiProperty({ type: [FathomCalendarInviteeDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FathomCalendarInviteeDto)
  @IsOptional()
  calendar_invitees?: FathomCalendarInviteeDto[];

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => FathomRecordedByDto)
  @IsOptional()
  recorded_by?: FathomRecordedByDto;

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => FathomCrmMatchesDto)
  @IsOptional()
  crm_matches?: FathomCrmMatchesDto;
}
