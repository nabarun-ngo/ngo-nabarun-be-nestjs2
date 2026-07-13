import { DomainEvent } from '@ce/nestjs-shared-core';
import type { CustomFieldValue } from '../aggregates/custom-field-value/custom-field-value.aggregate';

export type CustomFieldValuesUpdatedSnapshot = Pick<CustomFieldValue, 'id' | 'entityType' | 'entityId' | 'fieldDefId' | 'value'>;

/** Emitted by CustomFieldValue.setValue() after a successful value change. */
export class CustomFieldValuesUpdatedEvent extends DomainEvent<CustomFieldValuesUpdatedSnapshot> {
  constructor(snapshot: CustomFieldValuesUpdatedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
