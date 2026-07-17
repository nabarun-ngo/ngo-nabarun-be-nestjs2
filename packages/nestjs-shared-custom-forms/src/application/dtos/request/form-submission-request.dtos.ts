import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SaveFormDraftDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ type: Object, description: 'Map of field key → raw user-provided value' })
  @IsObject()
  values: Record<string, unknown>;
}

export class SubmitFormDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ type: Object, description: 'Optional final values to persist before submit' })
  @IsObject()
  @IsOptional()
  values?: Record<string, unknown>;
}

export class ClearFormSubmissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;
}
