import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class EnqueuedJobDto {
  @ApiProperty()
  @IsString()
  jobName: string;

  @ApiProperty()
  @IsString()
  queueJobId: string;
}

export class SkippedJobDto {
  @ApiProperty()
  @IsString()
  jobName: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class TriggerResultDto {
  @ApiProperty({ type: [EnqueuedJobDto] })
  @IsArray()
  @Type(() => EnqueuedJobDto)
  enqueuedJobs: EnqueuedJobDto[];

  @ApiProperty({ type: [SkippedJobDto] })
  @IsArray()
  @Type(() => SkippedJobDto)
  skippedJobs: SkippedJobDto[];
}

export class CronJobDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ description: '5-part UNIX cron expression' })
  @IsString()
  expression: string;

  @ApiProperty({ description: 'Human-readable expression, e.g. "At 08:00 AM"' })
  @IsString()
  readableExpression: string;

  @ApiProperty({ description: 'BullMQ job name = consumer job class constructor name' })
  @IsString()
  handler: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  nextRun?: Date;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;
}
