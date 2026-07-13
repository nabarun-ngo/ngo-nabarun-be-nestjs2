export interface EntityTypeConfig {
  entityType: string;
  /** User needs AT LEAST ONE of these to read comments on this entity type. */
  readPermissions?: string[];
  /** User needs AT LEAST ONE of these to write/delete comments on this entity type. */
  writePermissions?: string[];
}

export type { EntityTypeConfig as EntityTypeAccessConfig };

export interface Comment2NotificationOptions {
  /** Template key for mention emails. Defaults to 'COMMENT_MENTION'. */
  mentionTemplateKey?: string;
  /** Template key for subscriber emails on comment-added. Defaults to 'COMMENT_ADDED'. */
  subscriberTemplateKey?: string;
  /**
   * When false, subscriber notifications (mode=resource) are suppressed entirely.
   * Defaults to true.
   */
  notifySubscribers?: boolean;
}

export interface Comment2ModuleOptions {
  /**
   * Every entity type the comment module will serve must be listed here.
   * Requests for unlisted entity types are rejected with 403.
   * To allow all entity types without permission checks, provide an empty array or omit.
   */
  allowedEntityTypes: EntityTypeConfig[];
  /**
   * Correspondence notification settings. When omitted, defaults apply.
   */
  notifications?: Comment2NotificationOptions;
}
