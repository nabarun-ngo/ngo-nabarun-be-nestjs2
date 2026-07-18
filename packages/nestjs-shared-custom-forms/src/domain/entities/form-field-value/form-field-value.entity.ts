import { randomUUID } from 'crypto';
import { BaseDomain } from '@nabarun-ngo/nestjs-shared-core';
import { FormFieldValueHistoryEntry } from '../form-field-value-history-entry/form-field-value-history-entry.entity';

/**
 * Child entity — no repository. Accessed only through the FormSubmission aggregate.
 */
export class FormFieldValue extends BaseDomain<string> {
  readonly #entityType: string;
  readonly #entityId: string;
  readonly #formId: string;
  readonly #fieldDefId: string;
  #value: string | null;
  #history: FormFieldValueHistoryEntry[];

  constructor(
    id: string,
    entityType: string,
    entityId: string,
    formId: string,
    fieldDefId: string,
    value: string | null,
    history: FormFieldValueHistoryEntry[],
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#entityType = entityType;
    this.#entityId = entityId;
    this.#formId = formId;
    this.#fieldDefId = fieldDefId;
    this.#value = value;
    this.#history = history;
  }

  static create(params: {
    entityType: string;
    entityId: string;
    formId: string;
    fieldDefId: string;
    value: string | null;
    changedBy: string;
  }): FormFieldValue {
    const fieldValue = new FormFieldValue(
      randomUUID(),
      params.entityType,
      params.entityId,
      params.formId,
      params.fieldDefId,
      params.value,
      [],
    );
    if (params.value !== null) {
      fieldValue.#history.push(
        FormFieldValueHistoryEntry.create({
          formId: params.formId,
          fieldDefId: params.fieldDefId,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: null,
          newValue: params.value,
          changedBy: params.changedBy,
        }),
      );
    }
    return fieldValue;
  }

  /**
   * Sets a new raw (storage) value and records a history entry.
   * No-ops if the value is unchanged.
   */
  setValue(newValue: string | null, changedBy: string): boolean {
    if (newValue === this.#value) return false;

    this.#history.push(
      FormFieldValueHistoryEntry.create({
        formId: this.#formId,
        fieldDefId: this.#fieldDefId,
        entityType: this.#entityType,
        entityId: this.#entityId,
        oldValue: this.#value,
        newValue,
        changedBy,
      }),
    );
    this.#value = newValue;
    this.touch();
    return true;
  }

  get entityType(): string { return this.#entityType; }
  get entityId(): string { return this.#entityId; }
  get formId(): string { return this.#formId; }
  get fieldDefId(): string { return this.#fieldDefId; }
  get value(): string | null { return this.#value; }
  get history(): ReadonlyArray<FormFieldValueHistoryEntry> { return this.#history; }
}
