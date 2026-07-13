import { CustomFieldEntityTypePolicy, EntityTypeConfig } from './custom-field-entity-type.policy';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import {
  EntityTypeForbiddenError,
  MaxFieldsPerEntityTypeExceededError,
} from '../errors/custom-field.errors';

const donationConfig: EntityTypeConfig = {
  entityType: 'donation',
  managePermissions: ['manage:donations'],
  readPermissions: ['read:donations'],
  writePermissions: ['write:donations'],
  maxFields: 10,
  allowedFieldTypes: [CustomFieldType.Text, CustomFieldType.Number, CustomFieldType.Date],
};

describe('CustomFieldEntityTypePolicy', () => {
  describe('assertMaxFieldsNotExceeded()', () => {
    it('passes when count is below the cap', () => {
      expect(() =>
        CustomFieldEntityTypePolicy.assertMaxFieldsNotExceeded(5, donationConfig),
      ).not.toThrow();
    });

    it('throws MaxFieldsPerEntityTypeExceededError when count equals the cap', () => {
      expect(() =>
        CustomFieldEntityTypePolicy.assertMaxFieldsNotExceeded(10, donationConfig),
      ).toThrow(MaxFieldsPerEntityTypeExceededError);
    });

    it('throws when count exceeds the cap', () => {
      expect(() =>
        CustomFieldEntityTypePolicy.assertMaxFieldsNotExceeded(11, donationConfig),
      ).toThrow(MaxFieldsPerEntityTypeExceededError);
    });

    it('uses global max when config has no per-type max', () => {
      const config: EntityTypeConfig = { entityType: 'x' };
      expect(() =>
        CustomFieldEntityTypePolicy.assertMaxFieldsNotExceeded(5, config, 5),
      ).toThrow(MaxFieldsPerEntityTypeExceededError);
    });

    it('config maxFields takes precedence over globalMax', () => {
      // config.maxFields = 10, globalMax = 3 → limit is 10
      expect(() =>
        CustomFieldEntityTypePolicy.assertMaxFieldsNotExceeded(3, donationConfig, 3),
      ).not.toThrow(); // 3 < 10, so passes
    });

    it('no-ops when no max is configured', () => {
      const config: EntityTypeConfig = { entityType: 'x' };
      expect(() =>
        CustomFieldEntityTypePolicy.assertMaxFieldsNotExceeded(9999, config, undefined),
      ).not.toThrow();
    });
  });

  describe('assertFieldTypeAllowed()', () => {
    it('passes when fieldType is in the allowed list', () => {
      expect(() =>
        CustomFieldEntityTypePolicy.assertFieldTypeAllowed(CustomFieldType.Text, donationConfig),
      ).not.toThrow();
    });

    it('throws EntityTypeForbiddenError when fieldType is not allowed', () => {
      expect(() =>
        CustomFieldEntityTypePolicy.assertFieldTypeAllowed(CustomFieldType.Boolean, donationConfig),
      ).toThrow(EntityTypeForbiddenError);
    });

    it('no-ops when neither config nor global restrictions are set', () => {
      const config: EntityTypeConfig = { entityType: 'x' };
      expect(() =>
        CustomFieldEntityTypePolicy.assertFieldTypeAllowed(CustomFieldType.Boolean, config, undefined),
      ).not.toThrow();
    });

    it('uses globalAllowedFieldTypes when config has none', () => {
      const config: EntityTypeConfig = { entityType: 'x' };
      expect(() =>
        CustomFieldEntityTypePolicy.assertFieldTypeAllowed(CustomFieldType.Boolean, config, [CustomFieldType.Text]),
      ).toThrow(EntityTypeForbiddenError);
    });
  });
});
