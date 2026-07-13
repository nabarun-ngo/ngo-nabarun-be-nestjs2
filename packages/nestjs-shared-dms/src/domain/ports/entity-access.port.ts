export const IDocumentEntityAccessPort = Symbol('IDocumentEntityAccessPort');

export type DocumentAccessAction = 'read' | 'write';

/**
 * Optional port for record-level (entity-instance) access checks.
 * Consumers implement this when a permission check alone is not sufficient —
 * e.g. checking that the user is a member of the specific entity.
 *
 * Registration is optional — handlers use @Optional() @Inject(IDocumentEntityAccessPort).
 * If no provider is registered, record-level checks are skipped (permission-based
 * tier still applies via DocumentEntityTypePolicy).
 *
 * @example
 * @Injectable()
 * export class MyDocumentEntityAccessAdapter implements IDocumentEntityAccessPort {
 *   async canAccess({ entityType, entityId, userId, userPermissions, action }) {
 *     switch (entityType) {
 *       case 'donation': return this.donations.canUserAccess(entityId, userId, action);
 *       default:         return false;
 *     }
 *   }
 * }
 */
export interface IDocumentEntityAccessPort {
  canAccess(params: {
    entityType: string;
    entityId: string;
    userId: string;
    /** Already resolved by the auth guard — no extra DB call needed. */
    userPermissions: string[];
    action: DocumentAccessAction;
  }): Promise<boolean>;
}
