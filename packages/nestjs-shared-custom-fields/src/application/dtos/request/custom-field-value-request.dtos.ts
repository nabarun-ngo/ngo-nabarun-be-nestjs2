import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FieldValueInputDto {
  @ApiProperty({ description: 'fieldDefinition key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  value: string | number | boolean | string[] | null;
}

export class SetEntityFieldValuesRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ type: [FieldValueInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueInputDto)
  values: FieldValueInputDto[];
}

export class DeleteEntityFieldValuesRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;
}

export class GetEntityFieldValuesRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;
}

export class ValidateEntityFieldsRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;
}

export class GetEntityFieldValueHistoryRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ description: 'Filter to a specific field key' })
  @IsString()
  @IsOptional()
  fieldKey?: string;
}
