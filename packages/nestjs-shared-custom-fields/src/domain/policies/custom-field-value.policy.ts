import { CustomFieldType } from '../enums/custom-field-type.enum';
import {
  InvalidFieldValueError,
  InvalidFieldDefinitionError,
} from '../errors/custom-field.errors';
import { FieldOption } from '../value-objects/field-option/field-option.vo';
import { DependentOptions } from '../value-objects/dependent-options/dependent-options.vo';

/**
 * Pure domain policy enforcing invariants on raw field values before they reach
 * the infrastructure layer for serialisation and storage.
 *
 * No framework imports. No I/O. Static methods only.
 */
export class CustomFieldValuePolicy {
  /**
   * Throws InvalidFieldValueError when the primitive type of `value` does not
   * match the expected type for the given `fieldType`.
   */
  static assertValueType(
    fieldKey: string,
    fieldType: CustomFieldType,
    value: unknown,
  ): void {
    switch (fieldType) {
      case CustomFieldType.Text:
        if (typeof value !== 'string') {
          throw new InvalidFieldValueError(`Field "${fieldKey}" expects a string value`);
        }
        break;
      case CustomFieldType.Number:
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new InvalidFieldValueError(`Field "${fieldKey}" expects a finite number value`);
        }
        break;
      case CustomFieldType.Boolean:
        if (typeof value !== 'boolean') {
          throw new InvalidFieldValueError(`Field "${fieldKey}" expects a boolean value`);
        }
        break;
      case CustomFieldType.Date:
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          throw new InvalidFieldValueError(
            `Field "${fieldKey}" expects an ISO 8601 date string`,
          );
        }
        break;
      case CustomFieldType.Select:
        if (typeof value !== 'string') {
          throw new InvalidFieldValueError(`Field "${fieldKey}" expects a string key for select`);
        }
        break;
      case CustomFieldType.Multiselect:
        if (!Array.isArray(value) || !(value as unknown[]).every((v) => typeof v === 'string')) {
          throw new InvalidFieldValueError(
            `Field "${fieldKey}" expects an array of string keys for multiselect`,
          );
        }
        break;
    }
  }

  /**
   * Throws InvalidFieldDefinitionError when no options are configured, or
   * InvalidFieldValueError when a submitted key is not in the allowed set.
   * No-op for non-select/multiselect field types.
   */
  static assertOptionAllowed(
    fieldKey: string,
    fieldType: CustomFieldType,
    value: unknown,
    fieldOptions: ReadonlyArray<FieldOption>,
    dependentOptions: DependentOptions | null,
    currentParentValue: string | null,
  ): void {
    if (
      fieldType !== CustomFieldType.Select &&
      fieldType !== CustomFieldType.Multiselect
    ) {
      return;
    }

    const allowed = dependentOptions
      ? dependentOptions.getOptionsFor(currentParentValue)
      : fieldOptions;

    const allowedKeys = new Set([...allowed].map((o) => o.key));
    if (!allowedKeys.size) {
      throw new InvalidFieldDefinitionError(
        `Field "${fieldKey}" is a ${fieldType} field but has no options configured`,
      );
    }

    const keys = Array.isArray(value) ? (value as string[]) : [value as string];
    for (const key of keys) {
      if (!allowedKeys.has(key)) {
        throw new InvalidFieldValueError(
          `Value "${key}" is not an allowed option for field "${fieldKey}"`,
        );
      }
    }
  }
}
