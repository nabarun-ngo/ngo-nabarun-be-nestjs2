// Module
export { Dms2Module as DmsModule } from './dms.module';
export type { Dms2ModuleOptions as DmsModuleOptions } from './dms.schema';
export type { EntityTypeConfig as DmsEntityTypeConfig } from './dms.schema';

// Tokens (for consumers who provide implementations)
export { DMS2_OPTIONS as DMS_OPTIONS } from './infrastructure/dms-options.token';
export { IDocumentRepository } from './domain/repositories/document.repository';
export type { DocumentFilter } from './domain/repositories/document.repository';
export { IStorageProvider } from './domain/ports/storage.port';
export type {
  StorageUploadParams,
  StorageUploadResult,
} from './domain/ports/storage.port';
export { IDocumentEntityAccessPort } from './domain/ports/entity-access.port';
export type { DocumentAccessAction } from './domain/ports/entity-access.port';

// DTOs (for consumers who use DMS responses)
export { DocumentResponseDto, DocumentMappingDto } from './presentation/dtos/document-response.dto';

