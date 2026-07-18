import { Readable } from 'stream';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil } from '@nabarun-ngo/nestjs-shared-core';
import { DocumentAccessDeniedError, DocumentNotFoundError } from '../../../domain/errors/document.errors';
import { IDocumentEntityAccessPort } from '../../../domain/ports/entity-access.port';
import { IStorageProvider } from '../../../domain/ports/storage.port';
import { IDocumentRepository } from '../../../domain/repositories/document.repository';
import { DMS2_OPTIONS } from '../../../infrastructure/dms-options.application-token';
import { Dms2ModuleOptions } from '../../../dms.schema';
import { DownloadDocumentQuery } from './download-document.query';

export interface DownloadDocumentResult {
  fileName: string;
  contentType: string;
  stream: Readable;
}

@QueryHandler(DownloadDocumentQuery)
@Injectable()
export class DownloadDocumentHandler
  implements IQueryHandler<DownloadDocumentQuery, DownloadDocumentResult> {
  private readonly logger = new Logger(DownloadDocumentHandler.name);

  constructor(
    @Inject(IDocumentRepository)
    private readonly repo: IDocumentRepository,
    @Inject(IStorageProvider)
    private readonly storageProvider: IStorageProvider,
    @Inject(DMS2_OPTIONS)
    private readonly options: Dms2ModuleOptions,
    @Optional()
    @Inject(IDocumentEntityAccessPort)
    private readonly accessPort: IDocumentEntityAccessPort | null,
  ) { }

  async execute(query: DownloadDocumentQuery): Promise<DownloadDocumentResult> {
    const { documentId, userId, userPermissions } = query;

    // 1. Load document
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new DocumentNotFoundError(documentId);

    // HIGH-3: Public documents are freely accessible — skip all permission and
    // entity-level access checks so DocumentVisibility.Public has a real effect.
    if (!doc.isPublic) {
      // 2. Entity-type permission check — CRITICAL-1 (fail-closed).
      // Iterates over all mappings; grants access if ANY mapping passes both checks.
      let permissionGranted = doc.mappings.length === 0;
      for (const mapping of doc.mappings) {
        try {
          const config = EntityTypePolicyUtil.findConfig(mapping.refType, this.options.allowedEntityTypes, 'DOCUMENT');
          EntityTypePolicyUtil.assertHasPermission(config?.readPermissions, userPermissions, 'read', mapping.refType, 'DOCUMENT');
          permissionGranted = true;
          break;
        } catch {
          // Continue to next mapping
        }
      }
      if (!permissionGranted) {
        const firstMapping = doc.mappings[0];
        throw new DocumentAccessDeniedError('read', firstMapping.refType, firstMapping.refId);
      }

      // CRITICAL-2: Warn when record-level access port is not configured but doc has mappings
      if (!this.accessPort && doc.mappings.length > 0) {
        this.logger.warn(
          `[DMS2] IDocumentEntityAccessPort is not configured — record-level entity access check ` +
          `is BYPASSED for document ${documentId}. Register IDocumentEntityAccessPort to enable ` +
          `entity-level access control.`,
        );
      }

      // 3. Record-level access check — CRITICAL-1 (guard with mappings.length > 0).
      // Any-passes: grants access if at least one mapping's entity allows it.
      if (this.accessPort && doc.mappings.length > 0) {
        let instanceGranted = false;
        for (const mapping of doc.mappings) {
          const allowed = await this.accessPort.canAccess({
            entityType: mapping.refType,
            entityId: mapping.refId,
            userId,
            userPermissions,
            action: 'read',
          });
          if (allowed) {
            instanceGranted = true;
            break;
          }
        }
        if (!instanceGranted) {
          const firstMapping = doc.mappings[0];
          throw new DocumentAccessDeniedError('read', firstMapping.refType, firstMapping.refId);
        }
      }
    }

    // 4. Stream file from storage
    const stream = await this.storageProvider.downloadFile(doc.remotePath, doc.storageOwnerSub);
    return { fileName: doc.fileName, contentType: doc.contentType, stream };
  }
}
