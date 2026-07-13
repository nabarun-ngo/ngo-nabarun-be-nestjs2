import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { JobStatus } from '../../domain/enums/job-status.enum';

export class QueueJobSearchResultDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  jobName: string;

  @ApiProperty()
  @IsString()
  queueName: string;

  @ApiProperty({ enum: JobStatus })
  @IsString()
  status: JobStatus;

  @ApiProperty()
  payload: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failedReason?: string;

  @ApiProperty()
  @IsNumber()
  attemptsMade: number;

  @ApiProperty()
  @IsDate()
  enqueuedAt: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  finishedAt?: Date;
}
