import { Readable } from 'stream';
import { drive_v3 } from '@googleapis/drive';
import { OAuth2Client } from 'googleapis-common';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { BusinessError } from '@ce/nestjs-shared-core';
import { TokenVaultFacade, GOOGLE_SCOPES, TOKEN_VAULT_FACADE } from '@ce/nestjs-shared-token-vault';
import { DMS2_OPTIONS } from '../dms-options.token';
import {
  IStorageProvider,
  StorageUploadParams,
  StorageUploadResult,
} from '../../domain/ports/storage.port';

interface Dms2GoogleDriveConfig {
  folderId?: string;
}

interface Dms2OptionsWithDrive {
  googleDrive?: Dms2GoogleDriveConfig;
}

/**
 * Stores documents in the uploader's own Google Drive, via the per-user OAuth
 * connection managed by `TokenVault2Module`. DMS2 does not import/configure
 * `TokenVault2Module` itself — the host app is responsible for making
 * `TOKEN_VAULT2_FACADE` available (e.g. by importing `TokenVault2Module.forRoot({...})`
 * and passing it via `Dms2Module.forRoot(options, { imports: [TokenVault2Module...] })`).
 *
 * `tokenVault` is `@Optional()` because this adapter is always registered by
 * `Dms2Module` regardless of which provider is selected. If `TokenVault2Module`
 * was never made available and Drive storage is actually selected, a clear,
 * actionable error is thrown on first use instead of failing at bootstrap.
 */
@Injectable()
export class GoogleDriveStorageAdapter implements IStorageProvider {
  constructor(
    @Inject(DMS2_OPTIONS) private readonly options: Dms2OptionsWithDrive,
    @Optional()
    @Inject(TOKEN_VAULT_FACADE)
    private readonly tokenVault?: TokenVaultFacade,
  ) {}

  private async getClient(ownerSub?: string): Promise<drive_v3.Drive> {
    if (!this.tokenVault) {
      throw new BusinessError(
        '[Dms2Module] The google-drive storage provider is selected, but TOKEN_VAULT2_FACADE ' +
          'is not available. Import TokenVault2Module (with Google OAuth configured) and pass it ' +
          'via Dms2Module.forRoot(options, { imports: [...] }) / forRootAsync({ imports: [...] }).',
        'DRIVE_TOKEN_VAULT_NOT_CONFIGURED',
      );
    }
    let accessToken: string;
    try {
      accessToken = await this.tokenVault.getAccessToken({
        provider: 'google',
        scope: GOOGLE_SCOPES.driveFile,
        ownerSub,
      });
    } catch {
      throw new BusinessError(
        'Connect your Google account before using Drive storage',
      );
    }
    const authClient = new OAuth2Client();
    authClient.setCredentials({ access_token: accessToken });
    return new drive_v3.Drive({ auth: authClient });
  }

  async uploadFile(params: StorageUploadParams): Promise<StorageUploadResult> {
    const drive = await this.getClient(params.ownerSub);
    const fileName = params.path.split('/').pop() ?? params.path;
    const folderId = this.options.googleDrive?.folderId;

    let response: { data: drive_v3.Schema$File };
    try {
      response = (await drive.files.create({
        requestBody: {
          name: fileName,
          ...(folderId ? { parents: [folderId] } : {}),
        },
        media: {
          mimeType: params.contentType,
          body: Readable.from(params.content),
        },
        fields: 'id, webViewLink',
      })) as unknown as { data: drive_v3.Schema$File };
    } catch (err: any) {
      if (err?.code === 404 || err?.response?.status === 404) throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      if (err?.code === 403 || err?.response?.status === 403) throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }

    const fileId = response.data.id;
    if (!fileId) {
      throw new BusinessError(
        'Google Drive did not return a file ID for the uploaded file',
        'DRIVE_UPLOAD_FAILED',
      );
    }
    if (!response.data.webViewLink) throw new BusinessError('Drive did not return a viewable URL', 'DRIVE_URL_MISSING');
    return { url: response.data.webViewLink, remotePath: fileId };
  }

  async deleteFile(remotePath: string, ownerSub?: string): Promise<void> {
    const drive = await this.getClient(ownerSub);
    try {
      await drive.files.delete({ fileId: remotePath });
    } catch (err: any) {
      if (err?.code === 404 || err?.response?.status === 404) throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      if (err?.code === 403 || err?.response?.status === 403) throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }
  }

  /**
   * Drive has no Firebase-style anonymous signed URL. Returns the file's
   * `webViewLink`, which only opens correctly for a viewer with access to that
   * file/account context — a genuine capability difference from Firebase.
   *
   * @param expireAfter Google Drive `webViewLink` has no expiry concept; this
   *   parameter is accepted for interface compatibility but is ignored.
   */
  async getSignedUrl(remotePath: string, ownerSub?: string): Promise<string> {
    const drive = await this.getClient(ownerSub);
    let response: { data: drive_v3.Schema$File };
    try {
      response = (await drive.files.get({
        fileId: remotePath,
        fields: 'webViewLink',
      })) as unknown as { data: drive_v3.Schema$File };
    } catch (err: any) {
      if (err?.code === 404 || err?.response?.status === 404) throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      if (err?.code === 403 || err?.response?.status === 403) throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }
    if (!response.data.webViewLink) throw new BusinessError('Drive did not return a viewable URL', 'DRIVE_URL_MISSING');
    return response.data.webViewLink;
  }

  async downloadFile(
    remotePath: string,
    ownerSub?: string,
  ): Promise<Readable> {
    const drive = await this.getClient(ownerSub);
    let response: { data: Readable };
    try {
      response = (await drive.files.get(
        { fileId: remotePath, alt: 'media' },
        { responseType: 'stream' },
      )) as unknown as { data: Readable };
    } catch (err: any) {
      if (err?.code === 404 || err?.response?.status === 404) throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      if (err?.code === 403 || err?.response?.status === 403) throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }
    return response.data;
  }

  // TODO (MEDIUM-2): Implement renameFile for Google Drive.
  // Google Drive supports updating the file name via the `files.update` API:
  //   await drive.files.update({ fileId: remotePath, requestBody: { name: newName } });
  // Implementation should follow the same error-mapping pattern used in uploadFile/deleteFile.
  // async renameFile(remotePath: string, newName: string, ownerSub?: string): Promise<void> { ... }
}
