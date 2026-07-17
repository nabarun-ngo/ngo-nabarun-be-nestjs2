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
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class FieldConditionDto {
  @ApiProperty()
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
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dependsOnKey: string;

  @ApiProperty()
  optionMap: Record<string, FieldOptionDto[]>;
}

export class FieldValidationRulesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pattern: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  regexErrMsg?: string;
}

const FIELD_TYPES = Object.values(CustomFieldType);

export class AddFormFieldDto {
  @ApiProperty()
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

  @ApiPropertyOptional({ type: FieldValidationRulesDto })
  @ValidateNested()
  @Type(() => FieldValidationRulesDto)
  @IsOptional()
  validationRules?: FieldValidationRulesDto;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  viewPermissions?: string[];
}

export class UpdateFormFieldDto {
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

  @ApiPropertyOptional({ type: FieldValidationRulesDto, nullable: true })
  @ValidateNested()
  @Type(() => FieldValidationRulesDto)
  @IsOptional()
  validationRules?: FieldValidationRulesDto | null;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  viewPermissions?: string[];
}

export class FieldSortOrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class BulkUpdateFieldSortOrderDto {
  @ApiProperty({ type: [FieldSortOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldSortOrderItemDto)
  items: FieldSortOrderItemDto[];
}
