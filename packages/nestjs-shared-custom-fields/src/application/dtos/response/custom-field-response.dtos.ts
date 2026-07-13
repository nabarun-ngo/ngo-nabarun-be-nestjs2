import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessGatedResponse } from '@ce/nestjs-shared-core';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';

export class FieldOptionResponseDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;
}

export class FieldConditionResponseDto {
  @ApiProperty()
  dependsOnKey: string;

  @ApiProperty()
  operator: string;

  @ApiProperty({ type: Object })
  value: string | number | boolean | string[];
}

export class DependentOptionsResponseDto {
  @ApiProperty()
  dependsOnKey: string;

  @ApiProperty({ description: 'parentValue → available FieldOptions' })
  optionMap: Record<string, FieldOptionResponseDto[]>;
}

export class CustomFieldDefinitionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ enum: Object.values(CustomFieldType) })
  fieldType: CustomFieldType;

  @ApiProperty()
  mandatory: boolean;

  @ApiProperty({ type: [FieldOptionResponseDto] })
  fieldOptions: FieldOptionResponseDto[];

  @ApiProperty()
  isHidden: boolean;

  @ApiProperty()
  isEncrypted: boolean;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional({ type: FieldConditionResponseDto, nullable: true })
  condition: FieldConditionResponseDto | null;

  @ApiPropertyOptional({ type: DependentOptionsResponseDto, nullable: true })
  dependentOptions: DependentOptionsResponseDto | null;

  @ApiProperty({
    type: [String],
    description: 'Required permissions (OR semantics). Empty array = visible to all.',
  })
  viewPermissions: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  updatedAt: Date | null;
}

export class ResolvedCustomFieldValueResponseDto {
  @ApiProperty()
  fieldDefId: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ enum: Object.values(CustomFieldType) })
  fieldType: CustomFieldType;

  @ApiPropertyOptional({ type: Object, nullable: true })
  value: unknown;

  @ApiProperty({ description: 'Resolved options for the current context (handles dependentOptions)' })
  availableOptions: FieldOptionResponseDto[];

  @ApiPropertyOptional({ type: DependentOptionsResponseDto, nullable: true })
  dependentOptions: DependentOptionsResponseDto | null;

  @ApiProperty()
  mandatory: boolean;

  @ApiProperty()
  isEncrypted: boolean;

  @ApiProperty()
  isHidden: boolean;

  @ApiPropertyOptional({ type: FieldConditionResponseDto, nullable: true })
  condition: FieldConditionResponseDto | null;
}

export class EntityFieldValidationResultResponseDto {
  @ApiProperty({ description: 'Whether the caller is permitted to validate fields for this entity' })
  hasAccess: boolean;

  @ApiPropertyOptional({ description: 'Machine-readable denial code when hasAccess is false' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Human-readable denial message when hasAccess is false' })
  message?: string;

  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: [String] })
  missingMandatory: string[];

  @ApiProperty({ type: [String], description: 'Keys of visible fields with invalid values' })
  conditionViolations: string[];
}

export class ListFieldDefinitionsResponseDto extends AccessGatedResponse<CustomFieldDefinitionResponseDto> {
  @ApiProperty({ type: [CustomFieldDefinitionResponseDto] })
  declare data: CustomFieldDefinitionResponseDto[];
}

export class CustomFieldValueHistoryEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fieldDefId: string;

  @ApiProperty()
  fieldKey: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional({ nullable: true })
  oldValue: string | null;

  @ApiPropertyOptional({ nullable: true })
  newValue: string | null;

  @ApiProperty()
  changedBy: string;

  @ApiProperty()
  changedAt: Date;
}

export class GetEntityFieldValuesResponseDto extends AccessGatedResponse<ResolvedCustomFieldValueResponseDto> {
    @ApiProperty({ type: [ResolvedCustomFieldValueResponseDto] })
    declare data: ResolvedCustomFieldValueResponseDto[];
  }

export class GetFieldValueHistoryResponseDto extends AccessGatedResponse<CustomFieldValueHistoryEntryResponseDto> {
  @ApiProperty({ type: [CustomFieldValueHistoryEntryResponseDto] })
  declare data: CustomFieldValueHistoryEntryResponseDto[];
}
