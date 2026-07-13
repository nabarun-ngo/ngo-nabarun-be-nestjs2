export const COMMENT_ENTITY_ACCESS_PORT = Symbol('COMMENT_ENTITY_ACCESS_PORT');

export type CommentAccessAction = 'read' | 'write';

/**
 * Optional port for record-level (entity-instance) access checks.
 * Consumers implement this when a permission check alone is not sufficient —
 * e.g. checking that the user is a member of the specific donation/task.
 *
 * Registration is optional — handlers use @Optional() @Inject(COMMENT_ENTITY_ACCESS_PORT).
 * If no provider is registered, record-level checks are skipped (permission-based
 * tier still applies via CommentEntityTypePolicy).
 *
 * @example
 * @Injectable()
 * export class MyCommentEntityAccessAdapter implements ICommentEntityAccessPort {
 *   async canAccess({ entityType, entityId, userId, userPermissions, action }) {
 *     switch (entityType) {
 *       case 'donation': return this.donations.canUserAccess(entityId, userId, action);
 *       case 'task':     return this.tasks.canUserAccess(entityId, userId, action);
 *       default:         return false;
 *     }
 *   }
 * }
 */
export interface ICommentEntityAccessPort {
  canAccess(params: {
    entityType: string;
    entityId: string;
    userId: string;
    /** Already resolved by the auth guard — no extra DB call needed. */
    userPermissions: string[];
    action: CommentAccessAction;
  }): Promise<boolean>;
}
