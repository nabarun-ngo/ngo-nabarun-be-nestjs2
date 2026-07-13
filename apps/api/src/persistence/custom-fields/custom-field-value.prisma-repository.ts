import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  CustomFieldValueWhereInput,
  CustomFieldValueWhereUniqueInput,
  CustomFieldValueOrderByWithRelationInput,
} from '../prisma/models';
import { ICustomFieldValueRepository } from '@ce/nestjs-shared-custom-fields';
import { CustomFieldValue } from '@ce/nestjs-shared-custom-fields/domain/aggregates/custom-field-value/custom-field-value.aggregate';
import { CustomFieldValueHistoryEntry } from '@ce/nestjs-shared-custom-fields/domain/entities/custom-field-value-history-entry/custom-field-value-history-entry.entity';
import { CustomFieldValueFilter } from '@ce/nestjs-shared-custom-fields/domain/repositories/custom-field-value.repository';

type CustomFieldValueRow = {
  id: string;
  entityType: string;
  entityId: string;
  fieldDefId: string;
  value: string | null;
  createdAt: Date;
  updatedAt: Date;
  historyEntries?: CustomFieldValueHistoryRow[];
};

type CustomFieldValueHistoryRow = {
  id: string;
  fieldDefId: string;
  entityType: string;
  entityId: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  createdAt: Date;
};

const INCLUDE_HISTORY = { historyEntries: { orderBy: { createdAt: 'asc' } } } as const;

@Injectable()
export class CustomFieldValuePrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'customFieldValue',
    CustomFieldValue,
    string,
    CustomFieldValueFilter,
    CustomFieldValueRow,
    CustomFieldValueWhereInput,
    CustomFieldValueWhereUniqueInput,
    any,
    any,
    CustomFieldValueOrderByWithRelationInput
  >
  implements ICustomFieldValueRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'customFieldValue');
  }

  // ── ICustomFieldValueRepository custom methods ──────────────────────────────

  async findByEntity(entityType: string, entityId: string): Promise<CustomFieldValue[]> {
    const rows = await (this.delegate).findMany({
      where: { entityType, entityId },
      include: INCLUDE_HISTORY,
    });
    return (rows as CustomFieldValueRow[]).map((row) => this.toDomain(row));
  }

  async upsertMany(
    entityType: string,
    entityId: string,
    items: Array<{ fieldDefId: string; value: string | null; changedBy: string }>,
  ): Promise<CustomFieldValue[]> {
    const results: CustomFieldValue[] = [];
    for (const item of items) {
      const existing = await (this.delegate).findFirst({
        where: { entityType, entityId, fieldDefId: item.fieldDefId },
        include: INCLUDE_HISTORY,
      }) as CustomFieldValueRow | null;

      if (existing) {
        const domain = this.toDomain(existing);
        domain.setValue(item.value, item.changedBy);

        const historyRow: CustomFieldValueHistoryRow = {
          id:         '',
          fieldDefId: item.fieldDefId,
          entityType,
          entityId,
          oldValue:   existing.value,
          newValue:   item.value,
          changedBy:  item.changedBy,
          createdAt:  new Date(),
        };

        const updated = await (this.delegate).update({
          where: { id: existing.id },
          data: {
            value:     item.value,
            updatedAt: new Date(),
            historyEntries: {
              create: {
                fieldDefId: historyRow.fieldDefId,
                entityType: historyRow.entityType,
                entityId:   historyRow.entityId,
                oldValue:   historyRow.oldValue,
                newValue:   historyRow.newValue,
                changedBy:  historyRow.changedBy,
                createdAt:  historyRow.createdAt,
              },
            },
          },
          include: INCLUDE_HISTORY,
        }) as CustomFieldValueRow;

        results.push(this.toDomain(updated));
      } else {
        const created = await (this.delegate).create({
          data: {
            entityType,
            entityId,
            fieldDefId: item.fieldDefId,
            value:      item.value,
            createdAt:  new Date(),
            historyEntries: item.value !== null
              ? {
                  create: {
                    fieldDefId: item.fieldDefId,
                    entityType,
                    entityId,
                    oldValue:  null,
                    newValue:  item.value,
                    changedBy: item.changedBy,
                    createdAt: new Date(),
                  },
                }
              : undefined,
          },
          include: INCLUDE_HISTORY,
        }) as CustomFieldValueRow;

        results.push(this.toDomain(created));
      }
    }
    return results;
  }

  async deleteByEntity(entityType: string, entityId: string): Promise<void> {
    await (this.delegate).deleteMany({ where: { entityType, entityId } });
  }

  async findHistoryByEntity(
    entityType: string,
    entityId: string,
    fieldDefId?: string,
  ): Promise<CustomFieldValueHistoryEntry[]> {
    const rows = await (this.database.client).customFieldValueHistoryEntry.findMany({
      where: {
        entityType,
        entityId,
        ...(fieldDefId ? { fieldDefId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    }) as CustomFieldValueHistoryRow[];

    return rows.map((row) =>
      new CustomFieldValueHistoryEntry(
        row.id,
        row.fieldDefId,
        row.entityType,
        row.entityId,
        row.oldValue,
        row.newValue,
        row.changedBy,
        row.createdAt,
      ),
    );
  }

  // ── PrismaCrudRepositoryBase mapping hooks ─────────────────────────────────

  protected toDomain(row: CustomFieldValueRow): CustomFieldValue {
    const history = (row.historyEntries ?? []).map(
      (h) =>
        new CustomFieldValueHistoryEntry(
          h.id,
          h.fieldDefId,
          h.entityType,
          h.entityId,
          h.oldValue,
          h.newValue,
          h.changedBy,
          h.createdAt,
        ),
    );
    return new CustomFieldValue(
      row.id,
      row.entityType,
      row.entityId,
      row.fieldDefId,
      row.value,
      history,
      row.createdAt,
      row.updatedAt ?? undefined,
    );
  }

  protected toCreateInput(entity: CustomFieldValue): any {
    return {
      id:         entity.id,
      entityType: entity.entityType,
      entityId:   entity.entityId,
      fieldDefId: entity.fieldDefId,
      value:      entity.value,
      createdAt:  entity.createdAt,
    };
  }

  protected toUpdateInput(_id: string, entity: CustomFieldValue): any {
    return {
      value:     entity.value,
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  protected toUniqueWhere(id: string): CustomFieldValueWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: CustomFieldValueFilter): CustomFieldValueWhereInput {
    return {
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.entityId   ? { entityId:   filter.entityId }   : {}),
      ...(filter?.fieldDefId ? { fieldDefId: filter.fieldDefId } : {}),
    };
  }

  protected defaultOrderBy(): CustomFieldValueOrderByWithRelationInput {
    return { createdAt: 'asc' };
  }
}
