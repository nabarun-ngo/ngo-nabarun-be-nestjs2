import { CustomFieldType } from '../../enums/custom-field-type.enum';
import { InvalidFieldDefinitionError } from '../../errors/form.errors';
import { FieldValidationRules } from './field-validation-rules.vo';

describe('FieldValidationRules', () => {
  it('creates rules for text fields with pattern and message', () => {
    const rules = FieldValidationRules.of('^[a-z]+$', 'Lowercase only', CustomFieldType.Text);

    expect(rules.pattern).toBe('^[a-z]+$');
    expect(rules.regexErrMsg).toBe('Lowercase only');
  });

  it('creates rules without regexErrMsg', () => {
    const rules = FieldValidationRules.of('^\\d+$', undefined, CustomFieldType.Number);

    expect(rules.regexErrMsg).toBeUndefined();
  });

  it('rejects empty pattern', () => {
    expect(() => FieldValidationRules.of('   ', undefined, CustomFieldType.Text)).toThrow(
      InvalidFieldDefinitionError,
    );
  });

  it('rejects invalid regex', () => {
    expect(() => FieldValidationRules.of('[', undefined, CustomFieldType.Text)).toThrow(
      InvalidFieldDefinitionError,
    );
  });

  it('rejects pattern longer than 500 characters', () => {
    expect(() =>
      FieldValidationRules.of('a'.repeat(501), undefined, CustomFieldType.Text),
    ).toThrow(InvalidFieldDefinitionError);
  });

  it('rejects rules on unsupported field types', () => {
    expect(() => FieldValidationRules.of('^a$', undefined, CustomFieldType.Select)).toThrow(
      InvalidFieldDefinitionError,
    );
  });

  it('rejects empty regexErrMsg when provided', () => {
    expect(() => FieldValidationRules.of('^a$', '   ', CustomFieldType.Text)).toThrow(
      InvalidFieldDefinitionError,
    );
  });

  it('matches text values against pattern', () => {
    const rules = FieldValidationRules.of('^hello$', undefined, CustomFieldType.Text);

    expect(rules.matchesValue(CustomFieldType.Text, 'hello')).toBe(true);
    expect(rules.matchesValue(CustomFieldType.Text, 'world')).toBe(false);
  });

  it('matches number values as stringified numbers', () => {
    const rules = FieldValidationRules.of('^\\d+$', undefined, CustomFieldType.Number);

    expect(rules.matchesValue(CustomFieldType.Number, 42)).toBe(true);
    expect(rules.matchesValue(CustomFieldType.Number, 4.2)).toBe(false);
  });

  it('reconstructs from persisted data', () => {
    const rules = FieldValidationRules.fromPersisted('^x$', 'Must be x');

    expect(rules.pattern).toBe('^x$');
    expect(rules.regexErrMsg).toBe('Must be x');
  });
});
