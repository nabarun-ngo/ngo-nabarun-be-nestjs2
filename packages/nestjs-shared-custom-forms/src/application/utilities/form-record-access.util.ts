import { FormAccessDeniedError } from '../../domain/errors/form.errors';
import type { IFormEntityAccessPort } from '../../domain/ports/form-entity-access.port';

/**
 * Runs the optional record-level access check for form submissions.
 * - No-ops when `accessPort` is null or undefined (fail-open; permission-based tier still applies).
 * - Throws `FormAccessDeniedError` when `canAccess()` returns false.
 *
 * @example
 * await checkFormRecordAccess(
 *   this.accessPort,
 *   { formId, entityId, userId, userPermissions, action: 'read' },
 * );
 */
export async function checkFormRecordAccess(
  accessPort: IFormEntityAccessPort | null | undefined,
  params: {
    formId: string;
    entityId?: string;
    userId: string;
    userPermissions: string[];
    action: 'manage' | 'read' | 'write';
  },
): Promise<void> {
  if (!accessPort) return;
  const allowed = await accessPort.canAccess(params);
  if (!allowed) {
    throw new FormAccessDeniedError(params.action, params.formId, params.entityId);
  }
}
