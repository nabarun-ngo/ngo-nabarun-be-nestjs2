export const IFormEntityAccessPort = Symbol('IFormEntityAccessPort');

export type FormEntityAccessAction = 'manage' | 'read' | 'write';

/**
 * Optional per-form record-level access gate.
 *
 * CustomFormsModule is entity-agnostic — it never knows how donation/task/
 * meeting permissions work. The consuming app implements this interface once
 * and routes `canAccess()` to whichever domain module owns the form's entityType.
 *
 * If no provider is registered for `IFormEntityAccessPort`, all handlers skip
 * record-level checks (fail-open) and a boot warning is logged.
 *
 * Form-level permission checks via `FormAccessPolicy` still apply regardless
 * of whether this port is provided.
 */
export interface IFormEntityAccessPort {
  canAccess(params: {
    formId: string;
    /** Undefined for 'manage' — schema management is not scoped to one record. */
    entityId?: string;
    userId: string;
    userPermissions: string[];
    action: FormEntityAccessAction;
  }): Promise<boolean>;
}
