import { HttpModule } from '@nestjs/axios';
import {
  DynamicModule,
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
  Optional,
  Provider,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import * as admin from 'firebase-admin';
import {
  BaseDynamicModule,
  DynamicModuleAsyncOptions,
  MissingRequiredPortError,
  OAUTH_ACCESS_TOKEN_PORT,
} from '@nabarun-ngo/nestjs-shared-core';
import { Dms2ModuleOptions, Dms2OptionsSchema } from './dms.schema';
import { DMS2_OPTIONS } from './infrastructure/dms-options.token';
import { FIREBASE_ADMIN } from './infrastructure/firebase-admin.token';
import { IDocumentRepository } from './domain/repositories/document.repository';
import { IDocumentEntityAccessPort } from './domain/ports/entity-access.port';
import { IStorageProvider } from './domain/ports/storage.port';
import { FirebaseStorageService } from './infrastructure/storage/firebase-storage.service';
import { FirebaseStorageAdapter } from './infrastructure/storage/firebase-storage.adapter';
import { UploadDocumentHandler } from './application/commands/upload-document/upload-document.handler';
import { DeleteDocumentHandler } from './application/commands/delete-document/delete-document.handler';
import { RenameDocumentHandler } from './application/commands/rename-document/rename-document.handler';
import { ListDocumentsHandler } from './application/queries/list-documents/list-documents.handler';
import { GetSignedUrlHandler } from './application/queries/get-signed-url/get-signed-url.handler';
import { DownloadDocumentHandler } from './application/queries/download-document/download-document.handler';
import { OnDocumentUploadedHandler } from './application/event-handlers/on-document-uploaded/on-document-uploaded.handler';
import { OnDocumentDeletedHandler } from './application/event-handlers/on-document-deleted/on-document-deleted.handler';
import { Dms2Controller } from './presentation/controllers/dms.controller';

export interface Dms2ModuleAsyncOptions
  extends DynamicModuleAsyncOptions<Dms2ModuleOptions> {
  storageProvider?: Provider;
}

const ENTITY_ACCESS_PORT_MISSING_MSG =
  '[Dms2Module] IDocumentEntityAccessPort is not provided. ' +
  'Document read/write access will NOT be restricted by record-level entity checks — ' +
  'any authenticated user with the required permission can access documents on any entityType/entityId. ' +
  'Fix: implement IDocumentEntityAccessPort in your app, register ' +
  '{ provide: IDocumentEntityAccessPort, useClass: MyAdapter }, ' +
  'export the token from a module, and add that module to the ' +
  'imports array of Dms2Module.forRoot() / forRootAsync().';

@Injectable()
class Dms2EntityAccessServiceGuard implements OnApplicationBootstrap {
  private readonly logger = new Logger('Dms2Module');

  constructor(
    @Optional()
    @Inject(IDocumentEntityAccessPort)
    private readonly accessPort: IDocumentEntityAccessPort | null,
  ) { }

  onApplicationBootstrap(): void {
    if (this.accessPort) return;
    this.logger.warn(ENTITY_ACCESS_PORT_MISSING_MSG);
  }
}

@Injectable()
class DmsRequiredPortsGuard implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(DMS2_OPTIONS) private readonly options: Dms2ModuleOptions,
  ) { }

  onModuleInit(): void {
    const repo = this.moduleRef.get(IDocumentRepository, { strict: false });
    if (repo === undefined || repo === null) {
      throw new MissingRequiredPortError(
        'Dms2Module',
        IDocumentRepository,
        'Register IDocumentRepository in PersistenceModule and import PersistenceModule before Dms2Module.',
      );
    }

    if (this.options.provider !== 'google-drive') return;

    const oauth = this.moduleRef.get(OAUTH_ACCESS_TOKEN_PORT, { strict: false });
    if (oauth === undefined || oauth === null) {
      throw new MissingRequiredPortError(
        'Dms2Module',
        OAUTH_ACCESS_TOKEN_PORT,
        'Register { provide: OAUTH_ACCESS_TOKEN_PORT, useClass: TokenVaultOAuthAccessTokenAdapter } in IntegrationsModule. Requires TokenVaultModule with Google OAuth configured.',
      );
    }

    const storage = this.moduleRef.get(IStorageProvider, { strict: false });
    if (storage === undefined || storage === null) {
      throw new MissingRequiredPortError(
        'Dms2Module',
        IStorageProvider,
        'Pass storageProvider override with GoogleDriveStorageAdapter from apps/api/src/integrations/dms when provider is google-drive.',
      );
    }
  }
}

const COMMAND_HANDLERS = [
  UploadDocumentHandler,
  DeleteDocumentHandler,
  RenameDocumentHandler,
];

const QUERY_HANDLERS = [
  ListDocumentsHandler,
  GetSignedUrlHandler,
  DownloadDocumentHandler,
];

const EVENT_HANDLERS = [OnDocumentUploadedHandler, OnDocumentDeletedHandler];

@Module({})
export class Dms2Module extends BaseDynamicModule {
  static forRoot(
    options: Dms2ModuleOptions = {} as Dms2ModuleOptions,
    overrides: { storageProvider?: Provider; imports?: any[] } = {},
  ): DynamicModule {
    return Dms2Module._build(
      [Dms2Module.createOptionsProvider(DMS2_OPTIONS, Dms2OptionsSchema, options)],
      overrides.imports ?? [],
      overrides.storageProvider,
    );
  }

  static forRootAsync(options: Dms2ModuleAsyncOptions): DynamicModule {
    return Dms2Module._build(
      [
        {
          ...Dms2Module.createAsyncOptionsProvider(DMS2_OPTIONS, Dms2OptionsSchema, options),
        },
      ],
      options.imports,
      options.storageProvider,
    );
  }

  private static _build(
    optionsProviders: any[],
    extraImports: any[] = [],
    storageProviderOverride?: Provider,
  ): DynamicModule {
    const firebaseAdminProvider: Provider = {
      provide: FIREBASE_ADMIN,
      useFactory: (opts: Dms2ModuleOptions): admin.app.App | null => {
        if (opts.provider !== 'firebase' || !opts.firebase?.serviceAccount) return null;
        const sa =
          typeof opts.firebase.serviceAccount === 'string'
            ? JSON.parse(opts.firebase.serviceAccount)
            : opts.firebase.serviceAccount;
        const appName = `dms-${opts.firebase.projectId ?? 'default'}`;
        const existingApp = admin.apps.find((a) => a?.name === appName) ?? null;
        if (existingApp) return existingApp;
        return admin.initializeApp(
          {
            credential: admin.credential.cert(sa as admin.ServiceAccount),
            storageBucket: opts.firebase.storageBucket,
            projectId: opts.firebase.projectId,
          },
          appName,
        );
      },
      inject: [DMS2_OPTIONS],
    };

    const storageProviderBinding: Provider = storageProviderOverride ?? {
      provide: IStorageProvider,
      useFactory: (opts: Dms2ModuleOptions, firebaseAdapter: FirebaseStorageAdapter) => {
        if (opts.provider === 'google-drive') {
          throw new Error(
            '[Dms2Module] provider=google-drive requires a storageProvider override from the host (GoogleDriveStorageAdapter).',
          );
        }
        return firebaseAdapter;
      },
      inject: [DMS2_OPTIONS, FirebaseStorageAdapter],
    };

    return {
      module: Dms2Module,
      imports: [...(extraImports ?? []), CqrsModule, HttpModule],
      controllers: [Dms2Controller],
      providers: [
        ...optionsProviders,
        Dms2EntityAccessServiceGuard,
        DmsRequiredPortsGuard,
        firebaseAdminProvider,
        FirebaseStorageService,
        FirebaseStorageAdapter,
        storageProviderBinding,
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
      ],
      exports: [DMS2_OPTIONS],
    };
  }
}
