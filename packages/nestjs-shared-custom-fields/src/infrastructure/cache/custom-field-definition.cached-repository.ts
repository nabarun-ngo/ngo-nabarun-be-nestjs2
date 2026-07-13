import { Injectable } from '@nestjs/common';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { CacheService } from '@ce/nestjs-shared-persistence';
import { CustomFieldDefinition } from '../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldType } from '../../domain/enums/custom-field-type.enum';
import { FieldOption } from '../../domain/value-objects/field-option/field-option.vo';
import { FieldCondition, type FieldConditionOperator } from '../../domain/value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '../../domain/value-objects/dependent-options/dependent-options.vo';
import {
  ICustomFieldDefinitionRepository,
  CustomFieldDefinitionFilter,
} from '../../domain/repositories/custom-field-definition.repository';

// ── Plain-data types used for Redis serialisation ──────────────────────────
// ES private fields (#) are not enumerable and therefore not included in
// JSON.stringify.  We project each aggregate's getters into a plain object
// before storing in Redis, then reconstruct the aggregate on the way back out.

interface FieldOptionData { key: string; label: string }

interface FieldConditionData {
  dependsOnKey: string;
  operator: FieldConditionOperator;
  value: string | number | boolean | string[];
}

interface DependentOptionsData {
  dependsOnKey: string;
  optionMap: Record<string, FieldOptionData[]>;
}

interface CustomFieldDefinitionSnapshot {
  id: string;
  entityType: string;
  key: string;
  label: string;
  fieldType: string;
  mandatory: boolean;
  fieldOptions: FieldOptionData[];
  isHidden: boolean;
  isEncrypted: boolean;
  active: boolean;
  sortOrder: number;
  condition: FieldConditionData | null;
  dependentOptions: DependentOptionsData | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deactivatedBy?: string;
}

/**
 * Read-through / write-invalidate cache wrapper for CustomFieldDefinition.
 *
 * Cache key scheme (prefix `cf2-def`):
 *   cf2-def:id:{id}                     → findById
 *   cf2-def:key:{entityType}:{key}      → findByKey
 *   cf2-def:et:{entityType}:all         → findByEntityType (all)
 *   cf2-def:et:{entityType}:active      → findByEntityType ({ activeOnly: true })
 *
 * findPaged, findAll, and count are filter-dependent and bypass the cache.
 */
@Injectable()
export class CustomFieldDefinitionCachedRepository
  implements ICustomFieldDefinitionRepository
{
  constructor(
    private readonly db: ICustomFieldDefinitionRepository,
    private readonly cache: CacheService,
    readonly ttlMs: number,
  ) {}

  // ── Cache key helpers ──────────────────────────────────────────────────────

  private cacheKeyById(id: string): string {
    return `cf2-def:id:${id}`;
  }

  private cacheKeyByDoc(entityType: string, key: string): string {
    return `cf2-def:key:${entityType}:${key}`;
  }

  private cacheKeyByEntityType(entityType: string, activeOnly: boolean): string {
    return `cf2-def:et:${entityType}:${activeOnly ? 'active' : 'all'}`;
  }

  // ── Snapshot serialisation / deserialisation ───────────────────────────────

  private toSnapshot(doc: CustomFieldDefinition): CustomFieldDefinitionSnapshot {
    return {
      id:          doc.id,
      entityType:  doc.entityType,
      key:         doc.key,
      label:       doc.label,
      fieldType:   doc.fieldType,
      mandatory:   doc.mandatory,
      fieldOptions: [...doc.fieldOptions].map((o) => ({ key: o.key, label: o.label })),
      isHidden:    doc.isHidden,
      isEncrypted: doc.isEncrypted,
      active:      doc.active,
      sortOrder:   doc.sortOrder,
      condition: doc.condition
        ? {
            dependsOnKey: doc.condition.dependsOnKey,
            operator:     doc.condition.operator,
            value:        doc.condition.value,
          }
        : null,
      dependentOptions: doc.dependentOptions
        ? {
            dependsOnKey: doc.dependentOptions.dependsOnKey,
            optionMap: Object.fromEntries(
              Object.entries(doc.dependentOptions.optionMap).map(([k, opts]) => [
                k,
                [...opts].map((o) => ({ key: o.key, label: o.label })),
              ]),
            ),
          }
        : null,
      createdAt:      doc.createdAt.toISOString(),
      updatedAt:      doc.updatedAt.toISOString(),
      createdBy:      doc.createdBy,
      deactivatedBy:  doc.deactivatedBy,
    };
  }

  private fromSnapshot(snap: CustomFieldDefinitionSnapshot): CustomFieldDefinition {
    const fieldOptions = snap.fieldOptions.map((o) => FieldOption.of(o.key, o.label));

    const condition: FieldCondition | null = snap.condition
      ? FieldCondition.of(snap.condition.dependsOnKey, snap.condition.operator, snap.condition.value)
      : null;

    const dependentOptions: DependentOptions | null = snap.dependentOptions
      ? DependentOptions.of(
          snap.dependentOptions.dependsOnKey,
          Object.fromEntries(
            Object.entries(snap.dependentOptions.optionMap).map(([k, opts]) => [
              k,
              opts.map((o) => FieldOption.of(o.key, o.label)),
            ]),
          ),
        )
      : null;

    return new CustomFieldDefinition(
      snap.id,
      snap.entityType,
      snap.key,
      snap.label,
      snap.fieldType as CustomFieldType,
      snap.mandatory,
      fieldOptions,
      snap.isHidden,
      snap.isEncrypted,
      snap.active,
      snap.sortOrder,
      condition,
      dependentOptions,
      new Date(snap.createdAt),
      new Date(snap.updatedAt),
      snap.createdBy,
      snap.deactivatedBy,
    );
  }

  // ── Read methods (cached) ──────────────────────────────────────────────────

  async findById(id: string): Promise<CustomFieldDefinition | null> {
    const snap = await this.cache.getOrSet<CustomFieldDefinitionSnapshot | null>(
      this.cacheKeyById(id),
      async () => {
        const doc = await this.db.findById(id);
        return doc ? this.toSnapshot(doc) : null;
      },
      this.ttlMs,
    );
    return snap ? this.fromSnapshot(snap) : null;
  }

  async findByKey(entityType: string, key: string): Promise<CustomFieldDefinition | null> {
    const snap = await this.cache.getOrSet<CustomFieldDefinitionSnapshot | null>(
      this.cacheKeyByDoc(entityType, key),
      async () => {
        const doc = await this.db.findByKey(entityType, key);
        return doc ? this.toSnapshot(doc) : null;
      },
      this.ttlMs,
    );
    return snap ? this.fromSnapshot(snap) : null;
  }

  async findByEntityType(
    entityType: string,
    options?: { activeOnly?: boolean },
  ): Promise<CustomFieldDefinition[]> {
    const activeOnly = options?.activeOnly ?? false;
    const snaps = await this.cache.getOrSet<CustomFieldDefinitionSnapshot[]>(
      this.cacheKeyByEntityType(entityType, activeOnly),
      async () => {
        const docs = await this.db.findByEntityType(entityType, options);
        return docs.map((d) => this.toSnapshot(d));
      },
      this.ttlMs,
    );
    return snaps.map((s) => this.fromSnapshot(s));
  }

  // Pass-through — arbitrary filter combinations make per-query caching
  // impractical; these endpoints are used for admin/paged access only.
  findAll(filter?: CustomFieldDefinitionFilter): Promise<CustomFieldDefinition[]> {
    return this.db.findAll(filter);
  }

  findPaged(filter?: BaseFilter<CustomFieldDefinitionFilter>): Promise<Page<CustomFieldDefinition>> {
    return this.db.findPaged(filter);
  }

  count(filter: CustomFieldDefinitionFilter): Promise<number> {
    return this.db.count(filter);
  }

  // ── Write methods — persist then evict ────────────────────────────────────

  async create(entity: CustomFieldDefinition): Promise<CustomFieldDefinition> {
    const result = await this.db.create(entity);
    await this.evict(result);
    return result;
  }

  async update(id: string, entity: CustomFieldDefinition): Promise<CustomFieldDefinition> {
    const result = await this.db.update(id, entity);
    await this.evict(result);
    return result;
  }

  async delete(id: string): Promise<void> {
    // Resolve entityType/key before the row is gone so every cache entry can
    // be targeted.  findById hits the local cache first, so this is free when
    // the definition was already warmed.
    const existing = await this.findById(id);
    await this.db.delete(id);

    const ops: Promise<void>[] = [this.cache.del(this.cacheKeyById(id))];
    if (existing) {
      ops.push(
        this.cache.del(this.cacheKeyByDoc(existing.entityType, existing.key)),
        this.cache.del(this.cacheKeyByEntityType(existing.entityType, false)),
        this.cache.del(this.cacheKeyByEntityType(existing.entityType, true)),
      );
    }
    await Promise.all(ops);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async evict(doc: CustomFieldDefinition): Promise<void> {
    await Promise.all([
      this.cache.del(this.cacheKeyById(doc.id)),
      this.cache.del(this.cacheKeyByDoc(doc.entityType, doc.key)),
      this.cache.del(this.cacheKeyByEntityType(doc.entityType, false)),
      this.cache.del(this.cacheKeyByEntityType(doc.entityType, true)),
    ]);
  }
}
