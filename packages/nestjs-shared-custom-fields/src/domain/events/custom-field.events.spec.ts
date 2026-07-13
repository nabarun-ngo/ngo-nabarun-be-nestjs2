import { CustomFieldDefinition } from '../aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldValue } from '../aggregates/custom-field-value/custom-field-value.aggregate';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldDefinitionCreatedEvent, type CustomFieldDefinitionCreatedSnapshot } from './custom-field-definition-created.event';
import { CustomFieldDefinitionUpdatedEvent } from './custom-field-definition-updated.event';
import { CustomFieldDefinitionDeactivatedEvent } from './custom-field-definition-deactivated.event';
import { CustomFieldValuesUpdatedEvent } from './custom-field-values-updated.event';
import { EntityFieldValuesDeletedEvent } from './entity-field-values-deleted.event';

function makeDefinition(): CustomFieldDefinition {
  return CustomFieldDefinition.create({
    entityType: 'donation',
    key: 'field_a',
    label: 'Field A',
    fieldType: CustomFieldType.Text,
  });
}

describe('custom-field domain events', () => {
  describe('CustomFieldDefinitionCreatedEvent', () => {
    it('carries the definition snapshot and has a defined aggregateId', () => {
      const def = makeDefinition();
      const event = new CustomFieldDefinitionCreatedEvent(def.toSnapshot<CustomFieldDefinitionCreatedSnapshot>());

      expect(event.snapshot.id).toBe(def.id);
      expect(event.aggregateId).toBe(def.id);
    });

    it('has an occurredAt date', () => {
      const event = new CustomFieldDefinitionCreatedEvent(makeDefinition().toSnapshot<CustomFieldDefinitionCreatedSnapshot>());

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('CustomFieldDefinitionUpdatedEvent', () => {
    it('carries the definition reference', () => {
      const def = makeDefinition();
      def.update({ label: 'Updated Label' });
      const event = def.domainEvents.find(
        (e) => e instanceof CustomFieldDefinitionUpdatedEvent,
      ) as CustomFieldDefinitionUpdatedEvent;

      expect(event).toBeDefined();
      expect(event.snapshot.id).toBe(def.id);
    });
  });

  describe('CustomFieldDefinitionDeactivatedEvent', () => {
    it('carries the definition reference with active === false', () => {
      const def = makeDefinition();
      def.deactivate();
      const event = def.domainEvents.find(
        (e) => e instanceof CustomFieldDefinitionDeactivatedEvent,
      ) as CustomFieldDefinitionDeactivatedEvent;

      expect(event).toBeDefined();
      expect(event.snapshot.active).toBe(false);
    });
  });

  describe('CustomFieldValuesUpdatedEvent', () => {
    it('carries the updated field value snapshot', () => {
      const fv = CustomFieldValue.create({
        entityType: 'donation',
        entityId: 'e1',
        fieldDefId: 'def-1',
        value: 'old',
        changedBy: 'u1',
      });
      fv.setValue('new', 'u1');
      const event = fv.domainEvents[0] as CustomFieldValuesUpdatedEvent;

      expect(event.snapshot.id).toBe(fv.id);
      expect(event.aggregateId).toBe(fv.id);
      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('EntityFieldValuesDeletedEvent', () => {
    it('carries entityType, entityId, and deletedByUserId', () => {
      const event = new EntityFieldValuesDeletedEvent('donation', 'entity-42', 'user|1');

      expect(event.entityType).toBe('donation');
      expect(event.entityId).toBe('entity-42');
      expect(event.deletedByUserId).toBe('user|1');
      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });
});
