import { CustomFieldType } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/enums/custom-field-type.enum';
import { toPublicApiFieldType } from './public-form-field-type.mapper';

describe('toPublicApiFieldType', () => {
  it('maps custom field types to public API uppercase labels', () => {
    expect(toPublicApiFieldType(CustomFieldType.Text)).toBe('TEXT');
    expect(toPublicApiFieldType(CustomFieldType.Textarea)).toBe('TEXTAREA');
    expect(toPublicApiFieldType(CustomFieldType.Email)).toBe('EMAIL');
    expect(toPublicApiFieldType(CustomFieldType.Phone)).toBe('PHONE');
    expect(toPublicApiFieldType(CustomFieldType.Number)).toBe('NUMBER');
    expect(toPublicApiFieldType(CustomFieldType.Boolean)).toBe('CHECKBOX');
    expect(toPublicApiFieldType(CustomFieldType.Date)).toBe('DATE');
    expect(toPublicApiFieldType(CustomFieldType.Select)).toBe('SELECT');
    expect(toPublicApiFieldType(CustomFieldType.Multiselect)).toBe('SELECT');
  });
});
