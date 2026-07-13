import { randomUUID } from 'crypto';
import { AggregateRoot } from '@ce/nestjs-shared-core';
import { CustomFieldValueHistoryEntry } from '../../entities/custom-field-value-history-entry/custom-field-value-history-entry.entity';
import { CustomFieldValuesUpdatedEvent, type CustomFieldValuesUpdatedSnapshot } from '../../events/custom-field-values-updated.event';

export class CustomFieldValue extends AggregateRoot<string> {
  #entityType: string;
  #entityId: string;
  #fieldDefId: string;
  #value: string | null;
  #history: CustomFieldValueHistoryEntry[];

  constructor(
    id: string,
    entityType: string,
    entityId: string,
    fieldDefId: string,
    value: string | null,
    history: CustomFieldValueHistoryEntry[],
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#entityType = entityType;
    this.#entityId   = entityId;
    this.#fieldDefId = fieldDefId;
    this.#value      = value;
    this.#history    = history;
  }

  static create(params: {
    entityType: string;
    entityId: string;
    fieldDefId: string;
    value: string | null;
    changedBy: string;
  }): CustomFieldValue {
    const fieldValue = new CustomFieldValue(
      randomUUID(),
      params.entityType,
      params.entityId,
      params.fieldDefId,
      params.value,
      [],
    );
    if (params.value !== null) {
      fieldValue.#history.push(
        CustomFieldValueHistoryEntry.create({
          fieldDefId: params.fieldDefId,
          entityType: params.entityType,
          entityId:   params.entityId,
          oldValue:   null,
          newValue:   params.value,
          changedBy:  params.changedBy,
        }),
      );
    }
    return fieldValue;
  }

  /**
   * Sets a new raw (storage) value and records a history entry.
   * No-ops if the value is unchanged.
   */
  setValue(newValue: string | null, changedBy: string): void {
    if (newValue === this.#value) return;

    this.#history.push(
      CustomFieldValueHistoryEntry.create({
        fieldDefId: this.#fieldDefId,
        entityType: this.#entityType,
        entityId:   this.#entityId,
        oldValue:   this.#value,
        newValue,
        changedBy,
      }),
    );
    this.#value = newValue;
    this.touch();
    this.addDomainEvent(new CustomFieldValuesUpdatedEvent(this.toSnapshot<CustomFieldValuesUpdatedSnapshot>()));
  }

  get entityType(): string                                      { return this.#entityType; }
  get entityId(): string                                        { return this.#entityId; }
  get fieldDefId(): string                                      { return this.#fieldDefId; }
  get value(): string | null                                    { return this.#value; }
  get history(): ReadonlyArray<CustomFieldValueHistoryEntry>    { return this.#history; }
}
