import { CustomFieldValue } from './custom-field-value.aggregate';
import { CustomFieldValuesUpdatedEvent } from '../../events/custom-field-values-updated.event';

function makeValue(value: string | null = 'initial', changedBy = 'user|1'): CustomFieldValue {
  return CustomFieldValue.create({
    entityType: 'donation',
    entityId: 'entity-1',
    fieldDefId: 'def-1',
    value,
    changedBy,
  });
}

describe('CustomFieldValue aggregate', () => {
  describe('create()', () => {
    it('creates a field value with correct properties', () => {
      const fv = makeValue('hello');

      expect(fv.id).toBeDefined();
      expect(fv.entityType).toBe('donation');
      expect(fv.entityId).toBe('entity-1');
      expect(fv.fieldDefId).toBe('def-1');
      expect(fv.value).toBe('hello');
    });

    it('records an initial history entry when value is non-null', () => {
      const fv = makeValue('hello');

      expect(fv.history).toHaveLength(1);
      expect(fv.history[0].oldValue).toBeNull();
      expect(fv.history[0].newValue).toBe('hello');
      expect(fv.history[0].changedBy).toBe('user|1');
    });

    it('records no history entry when initial value is null', () => {
      const fv = makeValue(null);

      expect(fv.history).toHaveLength(0);
    });
  });

  describe('setValue()', () => {
    it('updates value and emits CustomFieldValuesUpdatedEvent on a new value', () => {
      const fv = makeValue('old');

      fv.setValue('new', 'user|2');

      expect(fv.value).toBe('new');
      expect(fv.domainEvents).toHaveLength(1);
      expect(fv.domainEvents[0]).toBeInstanceOf(CustomFieldValuesUpdatedEvent);
    });

    it('records a history entry on value change', () => {
      const fv = makeValue('old');
      const historyLengthBefore = fv.history.length;

      fv.setValue('new', 'user|2');

      expect(fv.history.length).toBe(historyLengthBefore + 1);
      const lastEntry = fv.history[fv.history.length - 1];
      expect(lastEntry.oldValue).toBe('old');
      expect(lastEntry.newValue).toBe('new');
      expect(lastEntry.changedBy).toBe('user|2');
    });

    it('no-op when the same value is passed — no event emitted', () => {
      const fv = makeValue('same');
      fv.clearEvents();
      const historyLengthBefore = fv.history.length;

      fv.setValue('same', 'user|2');

      expect(fv.domainEvents).toHaveLength(0);
      expect(fv.history.length).toBe(historyLengthBefore);
      expect(fv.value).toBe('same');
    });

    it('no-op when setting null to null — no event emitted', () => {
      const fv = makeValue(null);
      fv.clearEvents();

      fv.setValue(null, 'user|2');

      expect(fv.domainEvents).toHaveLength(0);
    });

    it('emits event when changing from a value to null', () => {
      const fv = makeValue('something');
      fv.clearEvents();

      fv.setValue(null, 'user|2');

      expect(fv.value).toBeNull();
      expect(fv.domainEvents).toHaveLength(1);
    });
  });
});
