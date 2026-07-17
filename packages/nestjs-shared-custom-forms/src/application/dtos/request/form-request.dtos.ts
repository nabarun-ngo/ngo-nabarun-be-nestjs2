import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFormDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'Stable programmatic key, unique per entityType' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  managePermissions?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  readPermissions?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  writePermissions?: string[];
}

export class UpdateFormDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  managePermissions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  readPermissions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  writePermissions?: string[];
}

export class PublishFormDto {
  @ApiPropertyOptional({ description: 'Form id when not supplied via route param' })
  @IsString()
  @IsOptional()
  id?: string;
}

export class DisableFormDto {
  @ApiPropertyOptional({ description: 'Form id when not supplied via route param' })
  @IsString()
  @IsOptional()
  id?: string;
}
