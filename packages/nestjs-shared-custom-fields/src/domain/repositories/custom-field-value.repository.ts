import { IRepository } from '@ce/nestjs-shared-core';
import { CustomFieldValue } from '../aggregates/custom-field-value/custom-field-value.aggregate';
import { CustomFieldValueHistoryEntry } from '../entities/custom-field-value-history-entry/custom-field-value-history-entry.entity';

export interface CustomFieldValueFilter {
  entityType?: string;
  entityId?: string;
  fieldDefId?: string;
}

export const ICustomFieldValueRepository = Symbol('ICustomFieldValueRepository');

export interface ICustomFieldValueRepository
  extends IRepository<CustomFieldValue, string, CustomFieldValueFilter> {
  /**
   * Upserts values for one entity record keyed by (entityType, entityId, fieldDefId).
   * Passing `value: null` clears the value while preserving the row for history.
   */
  upsertMany(
    entityType: string,
    entityId: string,
    values: Array<{ fieldDefId: string; value: string | null; changedBy: string }>,
  ): Promise<CustomFieldValue[]>;

  findByEntity(entityType: string, entityId: string): Promise<CustomFieldValue[]>;

  deleteByEntity(entityType: string, entityId: string): Promise<void>;

  findHistoryByEntity(
    entityType: string,
    entityId: string,
    fieldDefId?: string,
  ): Promise<CustomFieldValueHistoryEntry[]>;
}
