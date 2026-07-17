import { z } from 'zod';
import { EntityTypeConfig } from './domain/policies/form-entity-type.policy';

export type { EntityTypeConfig };

/** Default TTL for cached form definitions: 30 days in milliseconds. */
export const DEFAULT_CUSTOM_FORMS_CACHE_TTL_MS = 2_592_000_000;

export const CustomFormsOptionsSchema = z.object({
  entityTypes: z
    .array(z.custom<EntityTypeConfig>())
    .optional(),
  encryptionKey: z
    .string()
    .min(32, 'encryptionKey must be at least 32 characters for AES-256')
    .optional(),
  /**
   * Time-to-live in milliseconds for cached Form entries.
   * Write operations evict relevant cache entries immediately.
   * Default: 2_592_000_000 (30 days).
   */
  cacheTtlMs: z
    .number()
    .int()
    .positive()
    .optional(),
});

export type CustomFormsModuleOptions = z.infer<typeof CustomFormsOptionsSchema>;
