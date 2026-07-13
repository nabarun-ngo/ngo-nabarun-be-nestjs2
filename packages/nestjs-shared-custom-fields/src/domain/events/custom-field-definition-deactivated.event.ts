import { DomainEvent } from '@ce/nestjs-shared-core';
import type { CustomFieldDefinition } from '../aggregates/custom-field-definition/custom-field-definition.aggregate';

export type CustomFieldDefinitionDeactivatedSnapshot = Pick<CustomFieldDefinition, 'id' | 'entityType' | 'key' | 'active'>;

/** Emitted by CustomFieldDefinition.deactivate(). */
export class CustomFieldDefinitionDeactivatedEvent extends DomainEvent<CustomFieldDefinitionDeactivatedSnapshot> {
  constructor(snapshot: CustomFieldDefinitionDeactivatedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
