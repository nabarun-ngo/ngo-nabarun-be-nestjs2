/**
 * GoogleDriveStorageAdapter unit tests.
 * Ported and updated from test/dms/google-drive-storage.adapter.spec.ts.
 *
 * Key differences from the stale spec:
 *   - TokenVaultFacade (TOKEN_VAULT2_FACADE) replaces the old GoogleOAuthService.
 *   - getAccessToken({ provider, scope, ownerSub }) replaces getAuthenticatedClient.
 *   - drive_v3.Drive is module-mocked before any imports.
 */

const mockFilesCreate = jest.fn();
const mockFilesGet = jest.fn();
const mockFilesDelete = jest.fn();

jest.mock('@googleapis/drive', () => ({
  drive_v3: {
    Drive: jest.fn().mockImplementation(() => ({
      files: {
        create: mockFilesCreate,
        get: mockFilesGet,
        delete: mockFilesDelete,
      },
    })),
  },
}));

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    setCredentials: jest.fn(),
  })),
}));

// Mock @ce/nestjs-shared-token-vault to avoid the transitive axios dependency that is not
// available in the Jest environment.
jest.mock('@ce/nestjs-shared-token-vault', () => ({
  GOOGLE_SCOPES: {
    driveFile: 'https://www.googleapis.com/auth/drive.file',
  },
  TOKEN_VAULT2_FACADE: Symbol('TOKEN_VAULT2_FACADE'),
}));

import 'reflect-metadata';
import { GoogleDriveStorageAdapter } from './google-drive-storage.adapter';
import { BusinessError } from '@ce/nestjs-shared-core';
import { GOOGLE_SCOPES } from '@ce/nestjs-shared-token-vault';

function buildTokenVaultMock(accessToken = 'access-token-xyz') {
  return {
    getAccessToken: jest.fn().mockResolvedValue(accessToken),
  };
}

function buildAdapter(options: any = {}, tokenVault?: any) {
  return new GoogleDriveStorageAdapter(options, tokenVault);
}

const UPLOAD_PARAMS = {
  path: 'uploads/report.pdf',
  contentType: 'application/pdf',
  token: 'unused-by-drive',
  content: Buffer.from('hello'),
  ownerSub: 'google-sub-1',
};

describe('GoogleDriveStorageAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile()', () => {
    it('resolves an access token with driveFile scope + ownerSub, then creates the file', async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({}, tokenVault);
      mockFilesCreate.mockResolvedValue({
        data: { id: 'drive-file-id', webViewLink: 'https://drive.google.com/file/d/drive-file-id' },
      });

      const result = await adapter.uploadFile(UPLOAD_PARAMS);

      expect(tokenVault.getAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
          scope: GOOGLE_SCOPES.driveFile,
          ownerSub: 'google-sub-1',
        }),
      );
      expect(mockFilesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: { name: 'report.pdf' },
          media: expect.objectContaining({ mimeType: 'application/pdf' }),
          fields: 'id, webViewLink',
        }),
      );
      expect(result).toEqual({
        url: 'https://drive.google.com/file/d/drive-file-id',
        remotePath: 'drive-file-id',
      });
    });

    it('includes the configured parent folder when googleDrive.folderId is set', async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({ googleDrive: { folderId: 'folder-1' } }, tokenVault);
      mockFilesCreate.mockResolvedValue({
        data: { id: 'id-1', webViewLink: 'https://drive.google.com/file/d/id-1' },
      });

      await adapter.uploadFile(UPLOAD_PARAMS);

      expect(mockFilesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: { name: 'report.pdf', parents: ['folder-1'] },
        }),
      );
    });

    it('throws when Google Drive does not return a file ID', async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({}, tokenVault);
      mockFilesCreate.mockResolvedValue({ data: {} });

      await expect(adapter.uploadFile(UPLOAD_PARAMS)).rejects.toThrow('did not return a file ID');
    });

    it('throws when webViewLink is missing from the upload response', async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({}, tokenVault);
      mockFilesCreate.mockResolvedValue({ data: { id: 'id-1' } });

      await expect(adapter.uploadFile(UPLOAD_PARAMS)).rejects.toThrow(
        'Drive did not return a viewable URL',
      );
    });
  });

  describe('deleteFile()', () => {
    it('resolves the per-user client and deletes the file by remotePath', async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({}, tokenVault);

      await adapter.deleteFile('drive-file-id', 'google-sub-1');

      expect(tokenVault.getAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ ownerSub: 'google-sub-1' }),
      );
      expect(mockFilesDelete).toHaveBeenCalledWith({ fileId: 'drive-file-id' });
    });
  });

  describe('getSignedUrl()', () => {
    it("returns the file's webViewLink", async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({}, tokenVault);
      mockFilesGet.mockResolvedValue({ data: { webViewLink: 'https://drive.google.com/view' } });

      const result = await adapter.getSignedUrl('drive-file-id', 'google-sub-1');

      expect(mockFilesGet).toHaveBeenCalledWith({
        fileId: 'drive-file-id',
        fields: 'webViewLink',
      });
      expect(result).toBe('https://drive.google.com/view');
    });

    it('throws when webViewLink is missing', async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({}, tokenVault);
      mockFilesGet.mockResolvedValue({ data: {} });

      await expect(adapter.getSignedUrl('drive-file-id')).rejects.toThrow(
        'Drive did not return a viewable URL',
      );
    });
  });

  describe('downloadFile()', () => {
    it('streams file content via alt=media', async () => {
      const tokenVault = buildTokenVaultMock();
      const adapter = buildAdapter({}, tokenVault);
      const stream = {} as NodeJS.ReadableStream;
      mockFilesGet.mockResolvedValue({ data: stream });

      const result = await adapter.downloadFile('drive-file-id', 'google-sub-1');

      expect(mockFilesGet).toHaveBeenCalledWith(
        { fileId: 'drive-file-id', alt: 'media' },
        { responseType: 'stream' },
      );
      expect(result).toBe(stream);
    });
  });

  describe('configuration failures', () => {
    it('throws a clear error when TOKEN_VAULT2_FACADE is not available (TokenVault2Module not imported)', async () => {
      const adapter = buildAdapter({}, undefined);

      await expect(adapter.uploadFile(UPLOAD_PARAMS)).rejects.toThrow(
        'TOKEN_VAULT2_FACADE',
      );
    });

    it('throws a BusinessError when the user has not connected their Google account (token fetch fails)', async () => {
      const tokenVault = {
        getAccessToken: jest.fn().mockRejectedValue(new Error('no token found')),
      };
      const adapter = buildAdapter({}, tokenVault);

      await expect(adapter.uploadFile(UPLOAD_PARAMS)).rejects.toBeInstanceOf(BusinessError);
      await expect(adapter.uploadFile(UPLOAD_PARAMS)).rejects.toThrow(
        'Connect your Google account',
      );
    });
  });
});
