import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldType } from '../../../domain/enums/custom-field-type.enum';
import { FormStatus } from '../../../domain/enums/form-status.enum';

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

export class FieldValidationRulesResponseDto {
  @ApiProperty({ description: 'JavaScript regex source (no delimiters)' })
  pattern: string;

  @ApiPropertyOptional({ description: 'Custom error message when the value does not match pattern' })
  regexErrMsg?: string;
}

export class FormFieldDefinitionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  formId: string;

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
  enabled: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional({ type: FieldConditionResponseDto, nullable: true })
  condition: FieldConditionResponseDto | null;

  @ApiPropertyOptional({ type: DependentOptionsResponseDto, nullable: true })
  dependentOptions: DependentOptionsResponseDto | null;

  @ApiPropertyOptional({ type: FieldValidationRulesResponseDto, nullable: true })
  validationRules: FieldValidationRulesResponseDto | null;

  @ApiProperty({ type: [String] })
  viewPermissions: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  updatedAt: Date | null;
}

export class FormResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: Object.values(FormStatus) })
  status: FormStatus;

  @ApiProperty({ type: [String] })
  managePermissions: string[];

  @ApiProperty({ type: [String] })
  readPermissions: string[];

  @ApiProperty({ type: [String] })
  writePermissions: string[];

  @ApiPropertyOptional({ type: [FormFieldDefinitionResponseDto] })
  fields?: FormFieldDefinitionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  updatedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy?: string;

  @ApiPropertyOptional({ nullable: true })
  publishedBy?: string;

  @ApiPropertyOptional({ nullable: true })
  disabledBy?: string;
}

export class ResolvedFormFieldValueResponseDto {
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

  @ApiProperty({ type: [FieldOptionResponseDto] })
  availableOptions: FieldOptionResponseDto[];

  @ApiPropertyOptional({ type: DependentOptionsResponseDto, nullable: true })
  dependentOptions: DependentOptionsResponseDto | null;

  @ApiProperty()
  mandatory: boolean;

  @ApiPropertyOptional({ type: FieldValidationRulesResponseDto, nullable: true })
  validationRules: FieldValidationRulesResponseDto | null;

  @ApiProperty()
  isEncrypted: boolean;

  @ApiProperty()
  isHidden: boolean;

  @ApiPropertyOptional({ type: FieldConditionResponseDto, nullable: true })
  condition: FieldConditionResponseDto | null;
}

export class FormValidationResultResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: [String] })
  missingMandatory: string[];

  @ApiProperty({ type: [String] })
  conditionViolations: string[];

  @ApiProperty({ type: [String] })
  validationViolations: string[];
}

export class FormFieldValueHistoryEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fieldDefId: string;

  @ApiProperty()
  fieldKey: string;

  @ApiProperty()
  formId: string;

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
