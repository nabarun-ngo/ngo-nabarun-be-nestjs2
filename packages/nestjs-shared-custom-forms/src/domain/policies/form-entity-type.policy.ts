import { EntityTypeForbiddenError } from '../errors/form.errors';

/**
 * Per-entity-type registration config.
 * Defined in code at module setup — allowlist only.
 */
export interface EntityTypeConfig {
  entityType: string;
  /** Human-readable display name for logs/errors. */
  displayName?: string;
}

/**
 * Custom-forms entity-type allowlist checks.
 * Form-level permissions and access are handled by FormAccessPolicy.
 */
export class FormEntityTypePolicy {
  /**
   * Throws EntityTypeForbiddenError when `entityType` is not in the allowlist.
   * No-ops when `allowedTypes` is empty or undefined (open — all types permitted).
   */
  static assertEntityTypeRegistered(
    entityType: string,
    allowedTypes: EntityTypeConfig[] | undefined,
  ): void {
    if (!allowedTypes?.length) return;
    const registered = allowedTypes.some((c) => c.entityType === entityType);
    if (!registered) {
      throw new EntityTypeForbiddenError(entityType);
    }
  }
}
