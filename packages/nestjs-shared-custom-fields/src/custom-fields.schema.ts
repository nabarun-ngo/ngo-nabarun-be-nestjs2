import { z } from 'zod';
import { CustomFieldType } from './domain/enums/custom-field-type.enum';
import { EntityTypeConfig } from './domain/policies/custom-field-entity-type.policy';

export type { EntityTypeConfig };

/** Default TTL for cached custom field definitions: 30 days in milliseconds. */
export const DEFAULT_CUSTOM_FIELDS2_CACHE_TTL_MS = 2_592_000_000;

export const CustomFields2OptionsSchema = z.object({
  entityTypes: z
    .array(z.custom<EntityTypeConfig>())
    .optional(),
  globalMaxFieldsPerEntityType: z
    .number()
    .int()
    .positive()
    .optional(),
  globalAllowedFieldTypes: z
    .array(z.nativeEnum(CustomFieldType))
    .optional(),
  encryptionKey: z
    .string()
    .min(32, 'encryptionKey must be at least 32 characters for AES-256')
    .optional(),
  /**
   * Time-to-live in milliseconds for cached CustomFieldDefinition entries.
   * Write operations (create, update, deactivate, bulk sort-order) evict
   * relevant cache entries immediately, so a long TTL is safe for mostly-
   * static definition data.
   * Default: 2_592_000_000 (30 days).
   */
  cacheTtlMs: z
    .number()
    .int()
    .positive()
    .optional(),
});

export type CustomFields2ModuleOptions = z.infer<typeof CustomFields2OptionsSchema>;
