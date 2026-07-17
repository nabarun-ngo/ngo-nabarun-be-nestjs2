import { CustomFieldType } from '../../enums/custom-field-type.enum';
import { InvalidFieldDefinitionError } from '../../errors/form.errors';

const MAX_PATTERN_LENGTH = 500;

const PATTERN_ALLOWED_TYPES = new Set<CustomFieldType>([
  CustomFieldType.Text,
  CustomFieldType.Number,
  CustomFieldType.Date,
]);

/**
 * Immutable value object for regex-based field validation rules.
 *
 * Applied at definition time to text, number, and date fields only.
 * The UI uses pattern + regexErrMsg for client-side validation;
 * the server enforces the same rules on write and validate.
 */
export class FieldValidationRules {
  private constructor(
    readonly pattern: string,
    readonly regexErrMsg: string | undefined,
  ) {}

  static of(
    pattern: string,
    regexErrMsg: string | undefined,
    fieldType: CustomFieldType,
  ): FieldValidationRules {
    if (!PATTERN_ALLOWED_TYPES.has(fieldType)) {
      throw new InvalidFieldDefinitionError(
        `validationRules.pattern is only supported for text, number, and date field types`,
      );
    }

    const trimmed = pattern?.trim();
    if (!trimmed) {
      throw new InvalidFieldDefinitionError('validationRules.pattern cannot be empty');
    }
    if (trimmed.length > MAX_PATTERN_LENGTH) {
      throw new InvalidFieldDefinitionError(
        `validationRules.pattern must not exceed ${MAX_PATTERN_LENGTH} characters`,
      );
    }

    try {
      // eslint-disable-next-line no-new
      new RegExp(trimmed);
    } catch {
      throw new InvalidFieldDefinitionError('validationRules.pattern is not a valid regular expression');
    }

    if (regexErrMsg !== undefined && regexErrMsg !== null && !String(regexErrMsg).trim()) {
      throw new InvalidFieldDefinitionError(
        'validationRules.regexErrMsg cannot be empty when provided',
      );
    }

    return new FieldValidationRules(trimmed, regexErrMsg?.trim() || undefined);
  }

  /** Reconstruct from persisted data without re-validating field type. */
  static fromPersisted(pattern: string, regexErrMsg?: string): FieldValidationRules {
    return new FieldValidationRules(pattern, regexErrMsg || undefined);
  }

  matchesValue(fieldType: CustomFieldType, value: unknown): boolean {
    const candidate = FieldValidationRules.toMatchString(fieldType, value);
    if (candidate === null) return true;
    return new RegExp(this.pattern).test(candidate);
  }

  private static toMatchString(fieldType: CustomFieldType, value: unknown): string | null {
    switch (fieldType) {
      case CustomFieldType.Text:
      case CustomFieldType.Date:
        return typeof value === 'string' ? value : null;
      case CustomFieldType.Number:
        return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
      default:
        return null;
    }
  }
}
