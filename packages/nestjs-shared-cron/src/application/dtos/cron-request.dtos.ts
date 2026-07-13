import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCronJobRequestDto {
  @ApiProperty({ description: 'Unique job name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '5-field cron expression, e.g. "0 8 * * *"' })
  @IsString()
  @IsNotEmpty()
  expression: string;

  @ApiProperty({
    description:
      'BullMQ job name — must match the consumer\'s job class constructor name, e.g. "SendDailyReportJob"',
  })
  @IsString()
  @IsNotEmpty()
  handler: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Default payload forwarded to the consumer handler' })
  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;
}

export class UpdateCronJobRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '5-field cron expression' })
  @IsString()
  @IsOptional()
  expression?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  handler?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;
}
