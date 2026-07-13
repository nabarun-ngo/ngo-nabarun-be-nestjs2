import { EntityAccessDeniedError } from '../../domain/errors/entity-access.errors';

/**
 * Minimal interface for the optional record-level access port used by
 * comment, dms, and custom-fields. Module-specific port interfaces
 * (ICommentEntityAccessPort, IDocumentEntityAccessPort, ICustomFieldEntityAccessPort)
 * are structurally compatible with this shape and can be passed directly.
 */
export interface IEntityAccessPort {
  canAccess(params: {
    entityType: string;
    entityId?: string;
    userId: string;
    userPermissions: string[];
    action: string;
  }): Promise<boolean>;
}

/**
 * Runs the optional record-level access check.
 * - No-ops when `accessPort` is null or undefined (fail-open; permission-based tier still applies).
 * - Throws `EntityAccessDeniedError` when `canAccess()` returns false.
 *
 * @param modulePrefix Optional prefix for the error code, e.g. 'COMMENT' → 'COMMENT_ACCESS_DENIED'.
 *
 * @example
 * await checkEntityRecordAccess(
 *   this.accessPort,
 *   { entityType, entityId, userId, userPermissions, action: 'read' },
 *   'COMMENT',
 * );
 */
export async function checkEntityRecordAccess(
  accessPort: IEntityAccessPort | null | undefined,
  params: {
    entityType: string;
    entityId?: string;
    userId: string;
    userPermissions: string[];
    action: string;
  },
  modulePrefix?: string,
): Promise<void> {
  if (!accessPort) return;
  const allowed = await accessPort.canAccess(params);
  if (!allowed) {
    throw new EntityAccessDeniedError(params.action, params.entityType, params.entityId, modulePrefix);
  }
}
