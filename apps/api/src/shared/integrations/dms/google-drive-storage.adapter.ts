import { Readable } from 'stream';
import { drive_v3 } from '@googleapis/drive';
import { OAuth2Client } from 'googleapis-common';
import { Inject, Injectable } from '@nestjs/common';
import {
  BusinessError,
  IOAuthAccessTokenPort,
  OAUTH_ACCESS_TOKEN_PORT,
} from '@ce/nestjs-shared-core';
import { DMS2_OPTIONS } from '@ce/nestjs-shared-dms/infrastructure/dms-options.token';
import {
  IStorageProvider,
  StorageUploadParams,
  StorageUploadResult,
} from '@ce/nestjs-shared-dms';

const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

interface Dms2GoogleDriveConfig {
  folderId?: string;
}

interface Dms2OptionsWithDrive {
  googleDrive?: Dms2GoogleDriveConfig;
}

@Injectable()
export class GoogleDriveStorageAdapter implements IStorageProvider {
  constructor(
    @Inject(DMS2_OPTIONS) private readonly options: Dms2OptionsWithDrive,
    @Inject(OAUTH_ACCESS_TOKEN_PORT)
    private readonly oauthTokens: IOAuthAccessTokenPort,
  ) {}

  private async getClient(ownerSub?: string): Promise<drive_v3.Drive> {
    let accessToken: string;
    try {
      accessToken = await this.oauthTokens.getAccessToken({
        provider: 'google',
        scope: GOOGLE_DRIVE_FILE_SCOPE,
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
      if (err?.code === 404 || err?.response?.status === 404) {
        throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      }
      if (err?.code === 403 || err?.response?.status === 403) {
        throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      }
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }

    const fileId = response.data.id;
    if (!fileId) {
      throw new BusinessError(
        'Google Drive did not return a file ID for the uploaded file',
        'DRIVE_UPLOAD_FAILED',
      );
    }
    if (!response.data.webViewLink) {
      throw new BusinessError('Drive did not return a viewable URL', 'DRIVE_URL_MISSING');
    }
    return { url: response.data.webViewLink, remotePath: fileId };
  }

  async deleteFile(remotePath: string, ownerSub?: string): Promise<void> {
    const drive = await this.getClient(ownerSub);
    try {
      await drive.files.delete({ fileId: remotePath });
    } catch (err: any) {
      if (err?.code === 404 || err?.response?.status === 404) {
        throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      }
      if (err?.code === 403 || err?.response?.status === 403) {
        throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      }
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }
  }

  async getSignedUrl(remotePath: string, ownerSub?: string): Promise<string> {
    const drive = await this.getClient(ownerSub);
    let response: { data: drive_v3.Schema$File };
    try {
      response = (await drive.files.get({
        fileId: remotePath,
        fields: 'webViewLink',
      })) as unknown as { data: drive_v3.Schema$File };
    } catch (err: any) {
      if (err?.code === 404 || err?.response?.status === 404) {
        throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      }
      if (err?.code === 403 || err?.response?.status === 403) {
        throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      }
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }
    if (!response.data.webViewLink) {
      throw new BusinessError('Drive did not return a viewable URL', 'DRIVE_URL_MISSING');
    }
    return response.data.webViewLink;
  }

  async downloadFile(remotePath: string, ownerSub?: string): Promise<Readable> {
    const drive = await this.getClient(ownerSub);
    let response: { data: Readable };
    try {
      response = (await drive.files.get(
        { fileId: remotePath, alt: 'media' },
        { responseType: 'stream' },
      )) as unknown as { data: Readable };
    } catch (err: any) {
      if (err?.code === 404 || err?.response?.status === 404) {
        throw new BusinessError('Drive file not found', 'DRIVE_FILE_NOT_FOUND', 404);
      }
      if (err?.code === 403 || err?.response?.status === 403) {
        throw new BusinessError('Drive access denied', 'DRIVE_ACCESS_DENIED', 403);
      }
      throw new BusinessError(err?.message ?? 'Drive operation failed', 'DRIVE_OPERATION_FAILED');
    }
    return response.data;
  }
}
