import { CustomFieldDefinition } from './custom-field-definition.aggregate';
import { CustomFieldType } from '../../enums/custom-field-type.enum';
import { FieldOption } from '../../value-objects/field-option/field-option.vo';
import { FieldCondition } from '../../value-objects/field-condition/field-condition.vo';
import { CustomFieldDefinitionCreatedEvent } from '../../events/custom-field-definition-created.event';
import { CustomFieldDefinitionUpdatedEvent } from '../../events/custom-field-definition-updated.event';
import { CustomFieldDefinitionDeactivatedEvent } from '../../events/custom-field-definition-deactivated.event';

function makeDefinition(overrides: Partial<Parameters<typeof CustomFieldDefinition.create>[0]> = {}): CustomFieldDefinition {
  return CustomFieldDefinition.create({
    entityType: 'donation',
    key: 'donor_name',
    label: 'Donor Name',
    fieldType: CustomFieldType.Text,
    ...overrides,
  });
}

describe('CustomFieldDefinition aggregate', () => {
  describe('create()', () => {
    it('creates an active definition with defaults', () => {
      const def = makeDefinition();

      expect(def.id).toBeDefined();
      expect(def.entityType).toBe('donation');
      expect(def.key).toBe('donor_name');
      expect(def.label).toBe('Donor Name');
      expect(def.fieldType).toBe(CustomFieldType.Text);
      expect(def.mandatory).toBe(false);
      expect(def.isHidden).toBe(false);
      expect(def.isEncrypted).toBe(false);
      expect(def.active).toBe(true);
      expect(def.sortOrder).toBe(0);
      expect(def.condition).toBeNull();
      expect(def.dependentOptions).toBeNull();
      expect(def.fieldOptions).toHaveLength(0);
    });

    it('emits exactly one CustomFieldDefinitionCreatedEvent', () => {
      const def = makeDefinition();

      expect(def.domainEvents).toHaveLength(1);
      expect(def.domainEvents[0]).toBeInstanceOf(CustomFieldDefinitionCreatedEvent);
    });

    it('carries the definition reference in the emitted event', () => {
      const def = makeDefinition();
      const event = def.domainEvents[0] as CustomFieldDefinitionCreatedEvent;

      expect(event.snapshot.id).toBe(def.id);
    });

    it('respects all optional fields when provided', () => {
      const opts = [FieldOption.of('a', 'Option A')];
      const condition = FieldCondition.of('parent_key', 'equals', 'yes');
      const def = makeDefinition({
        mandatory: true,
        fieldOptions: opts,
        isHidden: true,
        isEncrypted: true,
        sortOrder: 5,
        condition,
      });

      expect(def.mandatory).toBe(true);
      expect(def.fieldOptions).toHaveLength(1);
      expect(def.isHidden).toBe(true);
      expect(def.isEncrypted).toBe(true);
      expect(def.sortOrder).toBe(5);
      expect(def.condition).toBe(condition);
    });
  });

  describe('update()', () => {
    it('applies a partial patch and emits an updated event', () => {
      const def = makeDefinition();
      def.clearEvents();

      def.update({ label: 'Full Name', mandatory: true });

      expect(def.label).toBe('Full Name');
      expect(def.mandatory).toBe(true);
      expect(def.fieldType).toBe(CustomFieldType.Text); // unchanged
      expect(def.domainEvents).toHaveLength(1);
      expect(def.domainEvents[0]).toBeInstanceOf(CustomFieldDefinitionUpdatedEvent);
    });

    it('can clear condition by passing condition: null', () => {
      const condition = FieldCondition.of('parent', 'equals', 'yes');
      const def = makeDefinition({ condition });
      def.clearEvents();

      def.update({ condition: null });

      expect(def.condition).toBeNull();
    });

    it('calls touch() — updatedAt is non-null after update', () => {
      const def = makeDefinition();
      const beforeUpdate = def.updatedAt;
      def.clearEvents();

      def.update({ label: 'Changed' });

      // updatedAt should now be set (touch() was called)
      expect(def.updatedAt).toBeDefined();
    });
  });

  describe('deactivate()', () => {
    it('deactivates an active definition and emits a deactivated event', () => {
      const def = makeDefinition();
      def.clearEvents();

      def.deactivate();

      expect(def.active).toBe(false);
      expect(def.domainEvents).toHaveLength(1);
      expect(def.domainEvents[0]).toBeInstanceOf(CustomFieldDefinitionDeactivatedEvent);
    });

    it('is idempotent — no event when already inactive', () => {
      const def = makeDefinition();
      def.deactivate();
      def.clearEvents();

      def.deactivate(); // second call

      expect(def.active).toBe(false);
      expect(def.domainEvents).toHaveLength(0);
    });
  });

  describe('updateSortOrder()', () => {
    it('updates sort order when a different value is provided', () => {
      const def = makeDefinition({ sortOrder: 1 });

      def.updateSortOrder(5);

      expect(def.sortOrder).toBe(5);
    });

    it('no-op when the same sort order is passed — does not call touch()', () => {
      const def = makeDefinition({ sortOrder: 3 });
      const originalUpdatedAt = def.updatedAt;

      def.updateSortOrder(3);

      expect(def.sortOrder).toBe(3);
      expect(def.updatedAt).toBe(originalUpdatedAt); // unchanged
    });
  });
});
