import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil, EntityTypeForbiddenError, EntityAccessDeniedError, checkEntityRecordAccess } from '@ce/nestjs-shared-core';
import { IDocumentEntityAccessPort } from '../../../domain/ports/entity-access.port';
import { IDocumentRepository } from '../../../domain/repositories/document.repository';
import { DMS2_OPTIONS } from '../../../infrastructure/dms-options.application-token';
import { Dms2ModuleOptions } from '../../../dms.schema';
import { ListDocumentsResponseDto } from '../../../presentation/dtos/document-response.dto';
import { DocumentResponseMapper } from '../../mappers/document-response.mapper';
import { ListDocumentsQuery } from './list-documents.query';

@QueryHandler(ListDocumentsQuery)
@Injectable()
export class ListDocumentsHandler implements IQueryHandler<ListDocumentsQuery, ListDocumentsResponseDto> {
  constructor(
    @Inject(IDocumentRepository)
    private readonly repo: IDocumentRepository,
    @Inject(DMS2_OPTIONS)
    private readonly options: Dms2ModuleOptions,
    @Optional()
    @Inject(IDocumentEntityAccessPort)
    private readonly accessPort: IDocumentEntityAccessPort | null,
  ) {}

  async execute(query: ListDocumentsQuery): Promise<ListDocumentsResponseDto> {
    const { entityType, entityId, userId, userPermissions } = query;

    try {
      // 1. Allowlist + permission check
      const config = EntityTypePolicyUtil.findConfig(entityType, this.options.allowedEntityTypes, 'DOCUMENT');
      EntityTypePolicyUtil.assertHasPermission(
        config?.readPermissions,
        userPermissions,
        'read',
        entityType,
        'DOCUMENT',
      );

      // 2. Optional record-level access check
      await checkEntityRecordAccess(
        this.accessPort,
        { entityType, entityId, userId, userPermissions, action: 'read' },
        'DOCUMENT',
      );
    } catch (err) {
      if (err instanceof EntityTypeForbiddenError || err instanceof EntityAccessDeniedError) {
        return { hasAccess: false, reason: err.errorCode, message: err.message, data: [] };
      }
      throw err;
    }

    // 3. Fetch and map
    const docs = await this.repo.findAllByEntity(entityType, entityId);
    return { hasAccess: true, data: DocumentResponseMapper.toDtoList(docs) };
  }
}
