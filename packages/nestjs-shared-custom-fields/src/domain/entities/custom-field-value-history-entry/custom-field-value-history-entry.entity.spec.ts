import { CustomFieldValueHistoryEntry } from './custom-field-value-history-entry.entity';

describe('CustomFieldValueHistoryEntry entity', () => {
  describe('create()', () => {
    it('sets all fields correctly on creation', () => {
      const entry = CustomFieldValueHistoryEntry.create({
        fieldDefId: 'def-1',
        entityType: 'donation',
        entityId: 'entity-42',
        oldValue: 'old',
        newValue: 'new',
        changedBy: 'user|99',
      });

      expect(entry.id).toBeDefined();
      expect(entry.fieldDefId).toBe('def-1');
      expect(entry.entityType).toBe('donation');
      expect(entry.entityId).toBe('entity-42');
      expect(entry.oldValue).toBe('old');
      expect(entry.newValue).toBe('new');
      expect(entry.changedBy).toBe('user|99');
    });

    it('accepts null for both oldValue and newValue', () => {
      const entry = CustomFieldValueHistoryEntry.create({
        fieldDefId: 'def-1',
        entityType: 'donation',
        entityId: 'entity-1',
        oldValue: null,
        newValue: null,
        changedBy: 'user|1',
      });

      expect(entry.oldValue).toBeNull();
      expect(entry.newValue).toBeNull();
    });

    it('generates a unique UUID id each time', () => {
      const a = CustomFieldValueHistoryEntry.create({
        fieldDefId: 'd', entityType: 'x', entityId: 'e', oldValue: null, newValue: null, changedBy: 'u',
      });
      const b = CustomFieldValueHistoryEntry.create({
        fieldDefId: 'd', entityType: 'x', entityId: 'e', oldValue: null, newValue: null, changedBy: 'u',
      });

      expect(a.id).not.toBe(b.id);
    });
  });
});
