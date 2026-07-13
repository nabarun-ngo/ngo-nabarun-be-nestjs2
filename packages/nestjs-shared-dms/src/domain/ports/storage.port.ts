import { Readable } from 'stream';

export const IStorageProvider = Symbol('IStorageProvider');

export interface StorageUploadParams {
  /** Suggested storage key/path. Adapters that assign their own identifier
   * (e.g. Google Drive file IDs) may ignore this and return a different
   * `remotePath` instead. */
  path: string;
  contentType: string;
  /** Opaque access token used by adapters that support token-based public
   * access (e.g. Firebase Storage download tokens). Ignored by adapters
   * that don't have an equivalent concept. */
  token: string;
  content: Buffer;
  /** Identity of the uploading user, for adapters that store files under a
   * specific user's account (e.g. Google Drive, via TokenVaultModule). */
  ownerSub?: string;
}

export interface StorageUploadResult {
  /** Publicly reachable (or provider-appropriate) URL for the uploaded file. */
  url: string;
  /** The identifier the adapter actually stored the file under — persist
   * this, not the suggested `path`, since some providers assign their own. */
  remotePath: string;
}

/**
 * Storage backend abstraction for the DMS2 module. Command handlers depend only
 * on this interface — never on a concrete provider — so the storage backend
 * (Firebase Storage, Google Drive, ...) can be swapped via configuration
 * without touching application logic.
 *
 * `ownerSub` is only meaningful to per-user providers (e.g. Google Drive);
 * shared-bucket providers (e.g. Firebase) ignore it.
 */
export interface IStorageProvider {
  uploadFile(params: StorageUploadParams): Promise<StorageUploadResult>;
  deleteFile(remotePath: string, ownerSub?: string): Promise<void>;
  getSignedUrl(
    remotePath: string,
    ownerSub?: string,
    expireAfter?: number,
  ): Promise<string>;
  downloadFile(
    remotePath: string,
    ownerSub?: string,
  ): Promise<Readable>;
  /**
   * Renames / updates the display name of an already-uploaded file.
   *
   * This is optional — storage backends that use content-addressable keys
   * (e.g. Firebase Storage) or that do not expose a rename API natively may
   * leave this unimplemented. Callers MUST guard with `if (provider.renameFile)`
   * before invoking, and must treat a missing implementation as a no-op.
   *
   * TODO: Implement in FirebaseStorageAdapter and GoogleDriveStorageAdapter.
   */
  renameFile?(remotePath: string, newName: string, ownerSub?: string): Promise<void>;
}
