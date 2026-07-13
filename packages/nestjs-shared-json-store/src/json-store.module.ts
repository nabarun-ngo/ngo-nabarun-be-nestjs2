import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JsonStoreModuleOptions } from './json-store.schema';

import { CreateJsonDocumentHandler } from './application/commands/create-json-document/create-json-document.handler';
import { UpdateJsonDocumentHandler } from './application/commands/update-json-document/update-json-document.handler';
import { UpsertJsonDocumentHandler } from './application/commands/upsert-json-document/upsert-json-document.handler';
import { DeleteJsonDocumentHandler } from './application/commands/delete-json-document/delete-json-document.handler';

import { GetJsonDocumentHandler } from './application/queries/get-json-document/get-json-document.handler';
import { ListJsonDocumentsHandler } from './application/queries/list-json-documents/list-json-documents.handler';

import { JsonStoreFacade } from './application/services/json-store.facade';

import { JsonDocumentController } from './presentation/controllers/json-document.controller';

const COMMAND_HANDLERS = [
  CreateJsonDocumentHandler,
  UpdateJsonDocumentHandler,
  UpsertJsonDocumentHandler,
  DeleteJsonDocumentHandler,
];

const QUERY_HANDLERS = [GetJsonDocumentHandler, ListJsonDocumentsHandler];

@Module({})
export class JsonStoreModule {
  static forRoot(options: JsonStoreModuleOptions = {}): DynamicModule {
    return {
      module: JsonStoreModule,
      imports: [CqrsModule],
      controllers: options.exposeController ? [JsonDocumentController] : [],
      providers: [
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,

        JsonStoreFacade,
      ],
      exports: [JsonStoreFacade],
    };
  }
}
