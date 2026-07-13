import { DomainEvent } from '@ce/nestjs-shared-core';
import type { CustomFieldDefinition } from '../aggregates/custom-field-definition/custom-field-definition.aggregate';

export type CustomFieldDefinitionCreatedSnapshot = Pick<CustomFieldDefinition, 'id' | 'entityType' | 'key' | 'label' | 'fieldType'>;

/** Emitted by CustomFieldDefinition.create(). */
export class CustomFieldDefinitionCreatedEvent extends DomainEvent<CustomFieldDefinitionCreatedSnapshot> {
  constructor(snapshot: CustomFieldDefinitionCreatedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
