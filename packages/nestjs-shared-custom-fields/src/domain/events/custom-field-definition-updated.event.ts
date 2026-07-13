import { DomainEvent } from '@ce/nestjs-shared-core';
import type { CustomFieldDefinition } from '../aggregates/custom-field-definition/custom-field-definition.aggregate';

export type CustomFieldDefinitionUpdatedSnapshot = Pick<CustomFieldDefinition, 'id' | 'entityType' | 'key' | 'label' | 'active'>;

/** Emitted by CustomFieldDefinition.update(). */
export class CustomFieldDefinitionUpdatedEvent extends DomainEvent<CustomFieldDefinitionUpdatedSnapshot> {
  constructor(snapshot: CustomFieldDefinitionUpdatedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
