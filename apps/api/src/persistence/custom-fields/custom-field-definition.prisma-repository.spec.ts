import 'reflect-metadata';
import { CustomFieldDefinitionPrismaRepository } from './custom-field-definition.prisma-repository';
import { CustomFieldDefinition } from '@ce/nestjs-shared-custom-fields/domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '@ce/nestjs-shared-custom-fields/domain/enums/custom-field-type.enum';
import { FieldOption } from '@ce/nestjs-shared-custom-fields/domain/value-objects/field-option/field-option.vo';
import { FieldCondition } from '@ce/nestjs-shared-custom-fields/domain/value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '@ce/nestjs-shared-custom-fields/domain/value-objects/dependent-options/dependent-options.vo';

type CustomFieldDefinitionRow = {
  id: string;
  entityType: string;
  key: string;
  label: string;
  fieldType: string;
  mandatory: boolean;
  fieldOptionsJson: string | null;
  isHidden: boolean;
  isEncrypted: boolean;
  active: boolean;
  sortOrder: number;
  conditionJson: string | null;
  dependentOptionsJson: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

function makeRow(overrides: Partial<CustomFieldDefinitionRow> = {}): CustomFieldDefinitionRow {
  return {
    id: 'row-id-1',
    entityType: 'donation',
    key: 'donor_name',
    label: 'Donor Name',
    fieldType: 'text',
    mandatory: false,
    fieldOptionsJson: null,
    isHidden: false,
    isEncrypted: false,
    active: true,
    sortOrder: 0,
    conditionJson: null,
    dependentOptionsJson: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-06-01'),
    ...overrides,
  };
}

function buildRepository() {
  const mockDelegate = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  const mockDatabase = {
    client: { customFieldDefinition: mockDelegate },
  };

  const repo = new CustomFieldDefinitionPrismaRepository(mockDatabase as any);
  return { repo, mockDelegate };
}

describe('CustomFieldDefinitionPrismaRepository', () => {
  describe('toDomain()', () => {
    it('maps a basic row to a CustomFieldDefinition aggregate', () => {
      const { repo } = buildRepository();
      const row = makeRow();

      const domain = (repo as any).toDomain(row) as CustomFieldDefinition;

      expect(domain).toBeInstanceOf(CustomFieldDefinition);
      expect(domain.id).toBe('row-id-1');
      expect(domain.entityType).toBe('donation');
      expect(domain.key).toBe('donor_name');
      expect(domain.label).toBe('Donor Name');
      expect(domain.fieldType).toBe(CustomFieldType.Text);
      expect(domain.mandatory).toBe(false);
      expect(domain.isHidden).toBe(false);
      expect(domain.isEncrypted).toBe(false);
      expect(domain.active).toBe(true);
      expect(domain.sortOrder).toBe(0);
      expect(domain.condition).toBeNull();
      expect(domain.dependentOptions).toBeNull();
    });

    it('deserialises fieldOptionsJson into FieldOption array', () => {
      const { repo } = buildRepository();
      const row = makeRow({
        fieldOptionsJson: JSON.stringify([{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]),
      });

      const domain = (repo as any).toDomain(row) as CustomFieldDefinition;

      expect(domain.fieldOptions).toHaveLength(2);
      expect(domain.fieldOptions[0]).toBeInstanceOf(FieldOption);
      expect(domain.fieldOptions[0].key).toBe('a');
    });

    it('deserialises conditionJson into FieldCondition', () => {
      const { repo } = buildRepository();
      const row = makeRow({
        conditionJson: JSON.stringify({ dependsOnKey: 'parent', operator: 'equals', value: 'yes' }),
      });

      const domain = (repo as any).toDomain(row) as CustomFieldDefinition;

      expect(domain.condition).toBeInstanceOf(FieldCondition);
      expect(domain.condition!.dependsOnKey).toBe('parent');
      expect(domain.condition!.operator).toBe('equals');
      expect(domain.condition!.value).toBe('yes');
    });

    it('deserialises dependentOptionsJson into DependentOptions', () => {
      const { repo } = buildRepository();
      const row = makeRow({
        dependentOptionsJson: JSON.stringify({
          dependsOnKey: 'category',
          optionMap: { cat1: [{ key: 'x', label: 'X' }] },
        }),
      });

      const domain = (repo as any).toDomain(row) as CustomFieldDefinition;

      expect(domain.dependentOptions).toBeInstanceOf(DependentOptions);
      expect(domain.dependentOptions!.dependsOnKey).toBe('category');
      expect(domain.dependentOptions!.getOptionsFor('cat1')).toHaveLength(1);
    });

    it('handles null updatedAt gracefully', () => {
      const { repo } = buildRepository();
      const row = makeRow({ updatedAt: null });

      const domain = (repo as any).toDomain(row) as CustomFieldDefinition;

      // Should not throw; updatedAt may be undefined or null
      expect(domain).toBeInstanceOf(CustomFieldDefinition);
    });
  });

  describe('toCreateInput()', () => {
    it('maps a definition with no options/condition to create payload', () => {
      const { repo } = buildRepository();
      const def = CustomFieldDefinition.create({
        entityType: 'donation',
        key: 'field_a',
        label: 'Field A',
        fieldType: CustomFieldType.Text,
      });

      const input = (repo as any).toCreateInput(def) as Record<string, unknown>;

      expect(input.id).toBe(def.id);
      expect(input.entityType).toBe('donation');
      expect(input.key).toBe('field_a');
      expect(input.label).toBe('Field A');
      expect(input.fieldType).toBe('text');
      expect(input.mandatory).toBe(false);
      expect(input.fieldOptionsJson).toBeNull();
      expect(input.conditionJson).toBeNull();
      expect(input.dependentOptionsJson).toBeNull();
      expect(input.active).toBe(true);
    });

    it('serialises fieldOptions to JSON', () => {
      const { repo } = buildRepository();
      const def = CustomFieldDefinition.create({
        entityType: 'donation',
        key: 'category',
        label: 'Category',
        fieldType: CustomFieldType.Select,
        fieldOptions: [FieldOption.of('opt1', 'Option 1')],
      });

      const input = (repo as any).toCreateInput(def) as Record<string, unknown>;

      expect(input.fieldOptionsJson).toBe(JSON.stringify([{ key: 'opt1', label: 'Option 1' }]));
    });

    it('serialises condition to JSON', () => {
      const { repo } = buildRepository();
      const condition = FieldCondition.of('parent', 'equals', 'yes');
      const def = CustomFieldDefinition.create({
        entityType: 'donation',
        key: 'child',
        label: 'Child',
        fieldType: CustomFieldType.Text,
        condition,
      });

      const input = (repo as any).toCreateInput(def) as Record<string, unknown>;

      const parsed = JSON.parse(input.conditionJson as string);
      expect(parsed.dependsOnKey).toBe('parent');
      expect(parsed.operator).toBe('equals');
      expect(parsed.value).toBe('yes');
    });

    it('serialises dependentOptions to JSON', () => {
      const { repo } = buildRepository();
      const depOpts = DependentOptions.of('cat_field', {
        cat1: [FieldOption.of('a', 'A')],
      });
      const def = CustomFieldDefinition.create({
        entityType: 'donation',
        key: 'sub_field',
        label: 'Sub Field',
        fieldType: CustomFieldType.Select,
        dependentOptions: depOpts,
      });

      const input = (repo as any).toCreateInput(def) as Record<string, unknown>;

      const parsed = JSON.parse(input.dependentOptionsJson as string);
      expect(parsed.dependsOnKey).toBe('cat_field');
      expect(parsed.optionMap.cat1[0].key).toBe('a');
    });
  });

  describe('toUpdateInput()', () => {
    it('maps updatable fields and excludes id and key', () => {
      const { repo } = buildRepository();
      const def = CustomFieldDefinition.create({
        entityType: 'donation',
        key: 'field_a',
        label: 'Updated Label',
        fieldType: CustomFieldType.Number,
      });
      def.update({ label: 'Updated Label', mandatory: true });

      const input = (repo as any).toUpdateInput(def.id, def) as Record<string, unknown>;

      expect(input.label).toBe('Updated Label');
      expect(input.mandatory).toBe(true);
      expect(input.fieldType).toBe('number');
      expect(input).not.toHaveProperty('id');
      expect(input).not.toHaveProperty('key');
      expect(input).not.toHaveProperty('entityType');
    });

    it('includes updatedAt in the update payload', () => {
      const { repo } = buildRepository();
      const def = CustomFieldDefinition.create({
        entityType: 'donation',
        key: 'f',
        label: 'F',
        fieldType: CustomFieldType.Text,
      });

      const input = (repo as any).toUpdateInput(def.id, def) as Record<string, unknown>;

      expect(input.updatedAt).toBeDefined();
    });
  });

  describe('toUniqueWhere()', () => {
    it('returns { id } clause', () => {
      const { repo } = buildRepository();
      expect((repo as any).toUniqueWhere('abc')).toEqual({ id: 'abc' });
    });
  });

  describe('toFilterWhere()', () => {
    it('returns empty object for undefined filter', () => {
      const { repo } = buildRepository();
      expect((repo as any).toFilterWhere(undefined)).toEqual({});
    });

    it('applies entityType filter', () => {
      const { repo } = buildRepository();
      const result = (repo as any).toFilterWhere({ entityType: 'donation' });
      expect(result.entityType).toBe('donation');
    });

    it('applies active filter', () => {
      const { repo } = buildRepository();
      const result = (repo as any).toFilterWhere({ active: true });
      expect(result.active).toBe(true);
    });

    it('applies key filter', () => {
      const { repo } = buildRepository();
      const result = (repo as any).toFilterWhere({ key: 'donor_name' });
      expect(result.key).toBe('donor_name');
    });

    it('omits undefined filter fields', () => {
      const { repo } = buildRepository();
      const result = (repo as any).toFilterWhere({ entityType: 'donation' });
      expect(result).not.toHaveProperty('active');
      expect(result).not.toHaveProperty('key');
    });
  });

  describe('supportsSoftDelete()', () => {
    it('returns false', () => {
      const { repo } = buildRepository();
      // The base class returns false by default; no deletedAt column on this model
      expect((repo as any).supportsSoftDelete()).toBe(false);
    });
  });

  describe('findByKey()', () => {
    it('returns a domain entity when a matching row is found', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row = makeRow({ key: 'target_field' });
      mockDelegate.findFirst.mockResolvedValue(row);

      const result = await repo.findByKey('donation', 'target_field');

      expect(mockDelegate.findFirst).toHaveBeenCalledWith({
        where: { entityType: 'donation', key: 'target_field' },
      });
      expect(result).toBeInstanceOf(CustomFieldDefinition);
      expect(result!.key).toBe('target_field');
    });

    it('returns null when no matching row exists', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findFirst.mockResolvedValue(null);

      const result = await repo.findByKey('donation', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEntityType()', () => {
    it('returns active definitions ordered by sortOrder when activeOnly=true', async () => {
      const { repo, mockDelegate } = buildRepository();
      const row1 = makeRow({ key: 'b', sortOrder: 2 });
      const row2 = makeRow({ key: 'a', sortOrder: 1 });
      mockDelegate.findMany.mockResolvedValue([row1, row2]);

      const result = await repo.findByEntityType('donation', { activeOnly: true });

      expect(mockDelegate.findMany).toHaveBeenCalledWith({
        where: { entityType: 'donation', active: true },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('returns all definitions when activeOnly is not set', async () => {
      const { repo, mockDelegate } = buildRepository();
      mockDelegate.findMany.mockResolvedValue([makeRow()]);

      await repo.findByEntityType('donation');

      expect(mockDelegate.findMany).toHaveBeenCalledWith({
        where: { entityType: 'donation' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });
});
