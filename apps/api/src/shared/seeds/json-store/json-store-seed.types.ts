export interface JsonDocumentSeed {
  /** Unique key within the namespace (e.g. `'welcome-email'`). */
  key: string;
  /**
   * Logical grouping for the document (e.g. `'correspondence'`, `'cron'`).
   * Acts as the top-level scope when listing or fetching documents.
   */
  namespace: string;
  /** Arbitrary JSON payload stored verbatim. */
  payload: Record<string, unknown>;
  /**
   * Controls what happens when a document with this (key, namespace) already
   * exists in the database at seed time.
   *
   * - `'upsert'` *(default)* — always overwrite the payload with the seed file
   *   value. The seed file is the source of truth. Any API/manual edits made
   *   after the last deploy will be lost on the next deploy.
   *
   * - `'skip-if-exists'` — insert on the first deploy, then never touch the
   *   document again. API/manual edits are preserved across deployments. Use
   *   this for documents whose values are expected to be managed at runtime.
   */
  onConflict?: 'upsert' | 'skip-if-exists';
}

export interface JsonStoreSeedData {
  documents: JsonDocumentSeed[];
}
