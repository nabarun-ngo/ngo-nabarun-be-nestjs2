export const ICustomFieldEntityAccessPort = Symbol('ICustomFieldEntityAccessPort');

export type CustomFieldAccessAction = 'manage' | 'read' | 'write';

/**
 * Optional per-entity record-level access gate.
 *
 * CustomFields2Module is entity-agnostic — it never knows how donation/task/
 * meeting permissions work. The consuming app implements this interface once
 * and routes `canAccess()` to whichever domain module owns `entityType`.
 *
 * If no provider is registered for `ICustomFieldEntityAccessPort`, all
 * handlers skip record-level checks (fail-open) and a boot warning is logged.
 *
 * Permission-based checks via `CustomFieldEntityTypePolicy` still apply
 * regardless of whether this port is provided.
 */
export interface ICustomFieldEntityAccessPort {
  canAccess(params: {
    entityType: string;
    /** Undefined for 'manage' — definition management is not scoped to one record. */
    entityId?: string;
    userId: string;
    userPermissions: string[];
    action: CustomFieldAccessAction;
  }): Promise<boolean>;
}
