import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';

export class FieldOptionDto {
  @ApiProperty({ description: 'Stable programmatic key stored in the database' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Human-readable display label shown in the UI' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class FieldConditionDto {
  @ApiProperty({ description: 'Key of the parent field this condition depends on' })
  @IsString()
  @IsNotEmpty()
  dependsOnKey: string;

  @ApiProperty({ enum: ['equals', 'not_equals', 'in', 'not_in'] })
  @IsIn(['equals', 'not_equals', 'in', 'not_in'])
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';

  @ApiProperty({ type: Object })
  value: string | number | boolean | string[];
}

export class DependentOptionsDto {
  @ApiProperty({ description: 'Key of the parent select field' })
  @IsString()
  @IsNotEmpty()
  dependsOnKey: string;

  @ApiProperty({ description: 'Maps each parent option key to an array of child FieldOptions' })
  optionMap: Record<string, FieldOptionDto[]>;
}

const FIELD_TYPES = Object.values(CustomFieldType);

export class DefineFieldDefinitionRequestDto {
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

  @ApiProperty({ enum: FIELD_TYPES })
  @IsIn(FIELD_TYPES)
  fieldType: CustomFieldType;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  mandatory?: boolean;

  @ApiPropertyOptional({ type: [FieldOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldOptionDto)
  @IsOptional()
  fieldOptions?: FieldOptionDto[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ type: FieldConditionDto })
  @ValidateNested()
  @Type(() => FieldConditionDto)
  @IsOptional()
  condition?: FieldConditionDto;

  @ApiPropertyOptional({ type: DependentOptionsDto })
  @ValidateNested()
  @Type(() => DependentOptionsDto)
  @IsOptional()
  dependentOptions?: DependentOptionsDto;

  @ApiPropertyOptional({
    type: [String],
    description: 'Required permissions (OR semantics). Empty array = visible to all.',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  viewPermissions?: string[];
}

export class UpdateFieldDefinitionRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ enum: FIELD_TYPES })
  @IsIn(FIELD_TYPES)
  @IsOptional()
  fieldType?: CustomFieldType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  mandatory?: boolean;

  @ApiPropertyOptional({ type: [FieldOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldOptionDto)
  @IsOptional()
  fieldOptions?: FieldOptionDto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ type: FieldConditionDto, nullable: true })
  @ValidateNested()
  @Type(() => FieldConditionDto)
  @IsOptional()
  condition?: FieldConditionDto | null;

  @ApiPropertyOptional({ type: DependentOptionsDto, nullable: true })
  @ValidateNested()
  @Type(() => DependentOptionsDto)
  @IsOptional()
  dependentOptions?: DependentOptionsDto | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Required permissions (OR semantics). Empty array = visible to all.',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  viewPermissions?: string[];
}

export class SortOrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class BulkUpdateSortOrderRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ type: [SortOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortOrderItemDto)
  items: SortOrderItemDto[];
}

export class ListFieldDefinitionsRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  includeHidden?: boolean;
}
