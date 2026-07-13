import { HttpModule } from '@nestjs/axios';
import {
  DynamicModule,
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
  Optional,
  Provider,
} from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import * as admin from 'firebase-admin';
import { BaseDynamicModule, DynamicModuleAsyncOptions } from '@ce/nestjs-shared-core';
import { Dms2ModuleOptions, Dms2OptionsSchema } from './dms.schema';
import { DMS2_OPTIONS } from './infrastructure/dms-options.token';
import { FIREBASE_ADMIN } from './infrastructure/firebase-admin.token';
import { IDocumentRepository } from './domain/repositories/document.repository';
import {
  IDocumentEntityAccessPort,
} from './domain/ports/entity-access.port';
import { IStorageProvider } from './domain/ports/storage.port';
import { FirebaseStorageService } from './infrastructure/storage/firebase-storage.service';
import { FirebaseStorageAdapter } from './infrastructure/storage/firebase-storage.adapter';
import { GoogleDriveStorageAdapter } from './infrastructure/storage/google-drive-storage.adapter';
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
  ) {}

  onApplicationBootstrap(): void {
    if (this.accessPort) return;
    this.logger.warn(ENTITY_ACCESS_PORT_MISSING_MSG);
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

/**
 * Dms2Module — DDD-compliant document upload/storage module with a pluggable
 * storage backend (Firebase Storage or Google Drive) and entity-agnostic
 * mappings. Replaces the legacy `DmsModule`.
 *
 * ## Registration
 *   Dms2Module.forRoot({ ...options })
 *   Dms2Module.forRootAsync({ imports, useFactory, inject })
 *
 * ## Storage backend
 *
 * Set `provider: "firebase"` (default) or `provider: "google-drive"` to pick
 * the built-in backend. For custom backends (e.g. S3), pass a manual override:
 *
 *   Dms2Module.forRoot(options, { storageProvider: { provide: IStorageProvider, useClass: MyS3Adapter } })
 *
 * ### Firebase (default)
 *
 * Pass a `firebase` config block with your service-account credentials:
 *
 *   Dms2Module.forRoot({
 *     provider: 'firebase',
 *     firebase: { serviceAccount: process.env.FIREBASE_SA_JSON, storageBucket: '...' },
 *   })
 *
 * The firebase-admin SDK is initialised internally — no separate FirebaseModule
 * import is required.
 *
 * ## Optional — IDocumentEntityAccessPort
 *
 * For record-level access control (beyond permission-based checks), implement
 * `IDocumentEntityAccessPort` in your app and register the binding:
 *   { provide: IDocumentEntityAccessPort, useClass: MyAdapter }
 *
 * Export the token from a module and pass that module in the `imports` array.
 * If not provided, record-level checks are skipped (fail-open) and a boot warning is logged.
 */
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
        // MEDIUM-4: Guard against re-initialization when the module is imported
        // more than once (e.g. in testing or in a multi-module setup). A named app
        // scoped to this module prevents collisions with any default Firebase app
        // that the host application may have initialised independently.
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
      useFactory: (
        opts: Dms2ModuleOptions,
        firebaseAdapter: FirebaseStorageAdapter,
        driveAdapter: GoogleDriveStorageAdapter,
      ): IStorageProvider =>
        opts.provider === 'google-drive' ? driveAdapter : firebaseAdapter,
      inject: [DMS2_OPTIONS, FirebaseStorageAdapter, GoogleDriveStorageAdapter],
    };

    return {
      module: Dms2Module,
      imports: [...(extraImports ?? []), CqrsModule, HttpModule],
      controllers: [Dms2Controller],
      providers: [
        ...optionsProviders,
        Dms2EntityAccessServiceGuard,
        firebaseAdminProvider,
        FirebaseStorageService,
        FirebaseStorageAdapter,
        GoogleDriveStorageAdapter,
        storageProviderBinding,
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
      ],
      exports: [DMS2_OPTIONS],
    };
  }
}
