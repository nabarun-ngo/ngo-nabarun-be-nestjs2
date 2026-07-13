import { CustomFieldType } from '../enums/custom-field-type.enum';
import {
  EntityTypeForbiddenError,
  MaxFieldsPerEntityTypeExceededError,
} from '../errors/custom-field.errors';

/**
 * Per-entity-type registration config.
 * Defined in code at module setup — analogous to dms's EntityTypeConfig.
 */
export interface EntityTypeConfig {
  entityType: string;
  /** Human-readable display name for logs/errors. */
  displayName?: string;
  /** User needs AT LEAST ONE of these to manage field definitions. */
  managePermissions?: string[];
  /** User needs AT LEAST ONE of these to read field values. */
  readPermissions?: string[];
  /** User needs AT LEAST ONE of these to set field values. */
  writePermissions?: string[];
  /** Per-entity-type cap on active field definitions (overrides global). */
  maxFields?: number;
  /** Per-entity-type restriction on allowed field types (overrides global). */
  allowedFieldTypes?: CustomFieldType[];
}

/**
 * Custom-fields2-specific capacity and field-type policy checks.
 * Access control (allowlist + permissions + record-level port) is handled
 * by EntityTypePolicyUtil and checkEntityRecordAccess from @ce/nestjs-shared-core.
 */
export class CustomFieldEntityTypePolicy {
  /**
   * Throws MaxFieldsPerEntityTypeExceededError when the current field count
   * meets or exceeds the applicable cap (per-type override takes precedence).
   */
  static assertMaxFieldsNotExceeded(
    currentCount: number,
    config: EntityTypeConfig | null,
    globalMax?: number,
  ): void {
    const max = config?.maxFields ?? globalMax;
    if (max !== undefined && currentCount >= max) {
      throw new MaxFieldsPerEntityTypeExceededError(config?.entityType ?? 'unknown', max);
    }
  }

  /**
   * Throws EntityTypeForbiddenError when the requested fieldType is not in the
   * applicable allowlist (per-type override takes precedence over global).
   */
  static assertFieldTypeAllowed(
    fieldType: CustomFieldType,
    config: EntityTypeConfig | null,
    globalAllowedFieldTypes?: CustomFieldType[],
  ): void {
    const allowed = config?.allowedFieldTypes ?? globalAllowedFieldTypes;
    if (!allowed?.length) return;
    if (!allowed.includes(fieldType)) {
      throw new EntityTypeForbiddenError(
        `fieldType "${fieldType}" is not allowed for entityType "${config?.entityType ?? 'unknown'}"`,
      );
    }
  }
}
