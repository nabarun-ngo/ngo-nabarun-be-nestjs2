import { CustomFieldType } from '@ce/nestjs-shared-custom-forms/domain/enums/custom-field-type.enum';

const FIELD_TYPE_MAP: Record<CustomFieldType, string> = {
  [CustomFieldType.Text]: 'TEXT',
  [CustomFieldType.Textarea]: 'TEXTAREA',
  [CustomFieldType.Email]: 'EMAIL',
  [CustomFieldType.Phone]: 'PHONE',
  [CustomFieldType.Number]: 'NUMBER',
  [CustomFieldType.Boolean]: 'CHECKBOX',
  [CustomFieldType.Date]: 'DATE',
  [CustomFieldType.Select]: 'SELECT',
  [CustomFieldType.Multiselect]: 'SELECT',
};

export function toPublicApiFieldType(fieldType: CustomFieldType): string {
  return FIELD_TYPE_MAP[fieldType] ?? 'TEXT';
}
