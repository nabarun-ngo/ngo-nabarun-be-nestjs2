import { randomUUID } from 'crypto';
import { BaseDomain } from '@ce/nestjs-shared-core';

/**
 * Child entity — no repository. Accessed only through the CustomFieldValue aggregate.
 *
 * Records a single change to a custom field value: who changed it, when,
 * and what it changed from/to. The `createdAt` inherited from BaseDomain
 * serves as the change timestamp.
 */
export class CustomFieldValueHistoryEntry extends BaseDomain<string> {
  readonly #fieldDefId: string;
  readonly #entityType: string;
  readonly #entityId: string;
  readonly #oldValue: string | null;
  readonly #newValue: string | null;
  readonly #changedBy: string;

  constructor(
    id: string,
    fieldDefId: string,
    entityType: string,
    entityId: string,
    oldValue: string | null,
    newValue: string | null,
    changedBy: string,
    createdAt?: Date,
  ) {
    super(id, createdAt);
    this.#fieldDefId = fieldDefId;
    this.#entityType = entityType;
    this.#entityId = entityId;
    this.#oldValue = oldValue;
    this.#newValue = newValue;
    this.#changedBy = changedBy;
  }

  static create(params: {
    fieldDefId: string;
    entityType: string;
    entityId: string;
    oldValue: string | null;
    newValue: string | null;
    changedBy: string;
  }): CustomFieldValueHistoryEntry {
    return new CustomFieldValueHistoryEntry(
      randomUUID(),
      params.fieldDefId,
      params.entityType,
      params.entityId,
      params.oldValue,
      params.newValue,
      params.changedBy,
    );
  }

  get fieldDefId(): string    { return this.#fieldDefId; }
  get entityType(): string    { return this.#entityType; }
  get entityId(): string      { return this.#entityId; }
  get oldValue(): string | null { return this.#oldValue; }
  get newValue(): string | null { return this.#newValue; }
  get changedBy(): string     { return this.#changedBy; }
}
