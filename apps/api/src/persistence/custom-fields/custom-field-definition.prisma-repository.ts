import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  CustomFieldDefinitionWhereInput,
  CustomFieldDefinitionWhereUniqueInput,
  CustomFieldDefinitionOrderByWithRelationInput,
} from '../prisma/models';
import { CustomFieldType, ICustomFieldDefinitionRepository } from '@ce/nestjs-shared-custom-fields';
import { CustomFieldDefinition } from '@ce/nestjs-shared-custom-fields/domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { FieldOption } from '@ce/nestjs-shared-custom-fields/domain/value-objects/field-option/field-option.vo';
import { FieldCondition } from '@ce/nestjs-shared-custom-fields/domain/value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '@ce/nestjs-shared-custom-fields/domain/value-objects/dependent-options/dependent-options.vo';
import { CustomFieldDefinitionFilter } from '@ce/nestjs-shared-custom-fields/domain/repositories/custom-field-definition.repository';

/**
 * Local row shape for the `CustomFieldDefinition` Prisma model.
 * JSON columns are stored as text and deserialised in `toDomain`.
 */
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
  viewPermissionsJson: string | null;
  createdBy: string | null;
  deactivatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CustomFieldDefinitionPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'customFieldDefinition',
    CustomFieldDefinition,
    string,
    CustomFieldDefinitionFilter,
    CustomFieldDefinitionRow,
    CustomFieldDefinitionWhereInput,
    CustomFieldDefinitionWhereUniqueInput,
    any,
    any,
    CustomFieldDefinitionOrderByWithRelationInput
  >
  implements ICustomFieldDefinitionRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'customFieldDefinition');
  }

  // ── ICustomFieldDefinitionRepository ──────────────────────────────────────

  async findByKey(
    entityType: string,
    key: string,
  ): Promise<CustomFieldDefinition | null> {
    const row = await (this.delegate).findFirst({
      where: { entityType, key },
    });
    return row ? this.toDomain(row as CustomFieldDefinitionRow) : null;
  }

  async findByEntityType(
    entityType: string,
    options?: { activeOnly?: boolean },
  ): Promise<CustomFieldDefinition[]> {
    const rows = await (this.delegate).findMany({
      where: {
        entityType,
        ...(options?.activeOnly ? { active: true } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
    return (rows as CustomFieldDefinitionRow[]).map((row) => this.toDomain(row));
  }

  // ── PrismaCrudRepositoryBase mapping hooks ─────────────────────────────────

  protected toDomain(row: CustomFieldDefinitionRow): CustomFieldDefinition {
    const fieldOptions: FieldOption[] = row.fieldOptionsJson
      ? (JSON.parse(row.fieldOptionsJson) as Array<{ key: string; label: string }>).map(
          (o) => FieldOption.of(o.key, o.label),
        )
      : [];

    const condition: FieldCondition | null = row.conditionJson
      ? (() => {
          const c = JSON.parse(row.conditionJson) as {
            dependsOnKey: string;
            operator: 'equals' | 'not_equals' | 'in' | 'not_in';
            value: string | number | boolean | string[];
          };
          return FieldCondition.of(c.dependsOnKey, c.operator, c.value);
        })()
      : null;

    const dependentOptions: DependentOptions | null = row.dependentOptionsJson
      ? (() => {
          const d = JSON.parse(row.dependentOptionsJson) as {
            dependsOnKey: string;
            optionMap: Record<string, Array<{ key: string; label: string }>>;
          };
          const optionMap = Object.fromEntries(
            Object.entries(d.optionMap).map(([k, opts]) => [
              k,
              opts.map((o) => FieldOption.of(o.key, o.label)),
            ]),
          );
          return DependentOptions.of(d.dependsOnKey, optionMap);
        })()
      : null;

    const viewPermissions: string[] = row.viewPermissionsJson
      ? (JSON.parse(row.viewPermissionsJson) as string[])
      : [];

    return new CustomFieldDefinition(
      row.id,
      row.entityType,
      row.key,
      row.label,
      row.fieldType as CustomFieldType,
      row.mandatory,
      fieldOptions,
      row.isHidden,
      row.isEncrypted,
      row.active,
      row.sortOrder,
      condition,
      dependentOptions,
      row.createdAt,
      row.updatedAt ?? undefined,
      row.createdBy ?? undefined,
      row.deactivatedBy ?? undefined,
      viewPermissions,
    );
  }

  protected toCreateInput(entity: CustomFieldDefinition): any {
    return {
      id:                  entity.id,
      entityType:          entity.entityType,
      key:                 entity.key,
      label:               entity.label,
      fieldType:           entity.fieldType,
      mandatory:           entity.mandatory,
      fieldOptionsJson:    entity.fieldOptions.length
        ? JSON.stringify([...entity.fieldOptions].map((o) => ({ key: o.key, label: o.label })))
        : null,
      isHidden:            entity.isHidden,
      isEncrypted:         entity.isEncrypted,
      active:              entity.active,
      sortOrder:           entity.sortOrder,
      conditionJson:       entity.condition
        ? JSON.stringify({
            dependsOnKey: entity.condition.dependsOnKey,
            operator:     entity.condition.operator,
            value:        entity.condition.value,
          })
        : null,
      dependentOptionsJson: entity.dependentOptions
        ? JSON.stringify({
            dependsOnKey: entity.dependentOptions.dependsOnKey,
            optionMap: Object.fromEntries(
              Object.entries(entity.dependentOptions.optionMap).map(([k, opts]) => [
                k,
                [...opts].map((o) => ({ key: o.key, label: o.label })),
              ]),
            ),
          })
        : null,
      viewPermissionsJson: entity.viewPermissions.length
        ? JSON.stringify([...entity.viewPermissions])
        : null,
      createdBy:   entity.createdBy ?? null,
      createdAt:   entity.createdAt,
    };
  }

  protected toUpdateInput(_id: string, entity: CustomFieldDefinition): any {
    return {
      label:               entity.label,
      fieldType:           entity.fieldType,
      mandatory:           entity.mandatory,
      fieldOptionsJson:    entity.fieldOptions.length
        ? JSON.stringify([...entity.fieldOptions].map((o) => ({ key: o.key, label: o.label })))
        : null,
      isHidden:            entity.isHidden,
      isEncrypted:         entity.isEncrypted,
      active:              entity.active,
      sortOrder:           entity.sortOrder,
      conditionJson:       entity.condition
        ? JSON.stringify({
            dependsOnKey: entity.condition.dependsOnKey,
            operator:     entity.condition.operator,
            value:        entity.condition.value,
          })
        : null,
      dependentOptionsJson: entity.dependentOptions
        ? JSON.stringify({
            dependsOnKey: entity.dependentOptions.dependsOnKey,
            optionMap: Object.fromEntries(
              Object.entries(entity.dependentOptions.optionMap).map(([k, opts]) => [
                k,
                [...opts].map((o) => ({ key: o.key, label: o.label })),
              ]),
            ),
          })
        : null,
      viewPermissionsJson: entity.viewPermissions.length
        ? JSON.stringify([...entity.viewPermissions])
        : null,
      deactivatedBy: entity.deactivatedBy ?? null,
      updatedAt:     entity.updatedAt ?? new Date(),
    };
  }

  protected toUniqueWhere(id: string): CustomFieldDefinitionWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: CustomFieldDefinitionFilter): CustomFieldDefinitionWhereInput {
    return {
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.active !== undefined ? { active: filter.active } : {}),
      ...(filter?.key ? { key: filter.key } : {}),
    };
  }

  protected defaultOrderBy(): CustomFieldDefinitionOrderByWithRelationInput {
    return { sortOrder: 'asc' };
  }
}
