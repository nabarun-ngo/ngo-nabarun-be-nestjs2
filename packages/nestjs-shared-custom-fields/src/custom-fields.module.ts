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
import { BaseDynamicModule, DynamicModuleAsyncOptions } from '@ce/nestjs-shared-core';
import {
  CustomFields2ModuleOptions,
  CustomFields2OptionsSchema,
} from './custom-fields.schema';
import { CUSTOM_FIELDS2_OPTIONS } from './infrastructure/custom-fields-options.token';

// Domain / Repositories
import { ICustomFieldEntityAccessPort } from './domain/ports/entity-access.port';

// Infrastructure

// Application — Commands
import { DefineFieldDefinitionHandler } from './application/commands/define-field-definition/define-field-definition.handler';
import { UpdateFieldDefinitionHandler } from './application/commands/update-field-definition/update-field-definition.handler';
import { DeactivateFieldDefinitionHandler } from './application/commands/deactivate-field-definition/deactivate-field-definition.handler';
import { BulkUpdateSortOrderHandler } from './application/commands/bulk-update-sort-order/bulk-update-sort-order.handler';
import { SetEntityFieldValuesHandler } from './application/commands/set-entity-field-values/set-entity-field-values.handler';
import { DeleteEntityFieldValuesHandler } from './application/commands/delete-entity-field-values/delete-entity-field-values.handler';

// Application — Queries
import { ListFieldDefinitionsHandler } from './application/queries/list-field-definitions/list-field-definitions.handler';
import { GetEntityFieldValuesHandler } from './application/queries/get-entity-field-values/get-entity-field-values.handler';
import { ValidateEntityFieldsHandler } from './application/queries/validate-entity-fields/validate-entity-fields.handler';
import { GetEntityFieldValueHistoryHandler } from './application/queries/get-entity-field-value-history/get-entity-field-value-history.handler';

// Infrastructure — Services
import { FieldValueCodecService } from './infrastructure/services/field-value-codec.service';

// Presentation
import { CustomFieldDefinitionController } from './presentation/http/custom-field-definition.controller';
import { CustomFieldValueController } from './presentation/http/custom-field-value.controller';

export interface CustomFields2ModuleAsyncOptions
  extends DynamicModuleAsyncOptions<CustomFields2ModuleOptions> {}

const ENTITY_ACCESS_PORT_MISSING_MSG =
  '[CustomFields2Module] ICustomFieldEntityAccessPort is not provided. ' +
  'Record-level access checks will be SKIPPED — any user with the required ' +
  'entityType permission can read or write all entity field values. ' +
  'Fix: implement ICustomFieldEntityAccessPort and register it with ' +
  '{ provide: ICustomFieldEntityAccessPort, useClass: MyAdapter }.';

@Injectable()
class CustomFields2EntityAccessServiceGuard implements OnApplicationBootstrap {
  private readonly logger = new Logger('CustomFields2Module');

  constructor(
    @Optional()
    @Inject(ICustomFieldEntityAccessPort)
    private readonly accessPort: ICustomFieldEntityAccessPort | null,
  ) {}

  onApplicationBootstrap(): void {
    if (this.accessPort) return;
    this.logger.warn(ENTITY_ACCESS_PORT_MISSING_MSG);
  }
}

const COMMAND_HANDLERS = [
  DefineFieldDefinitionHandler,
  UpdateFieldDefinitionHandler,
  DeactivateFieldDefinitionHandler,
  BulkUpdateSortOrderHandler,
  SetEntityFieldValuesHandler,
  DeleteEntityFieldValuesHandler,
];

const QUERY_HANDLERS = [
  ListFieldDefinitionsHandler,
  GetEntityFieldValuesHandler,
  ValidateEntityFieldsHandler,
  GetEntityFieldValueHistoryHandler,
];

/**
 * CustomFields2Module — DDD-compliant dynamic custom field module.
 *
 * Supports per-entity-type registration, permission-based access, conditional
 * fields, cascading dropdowns, value history, and schema completeness validation.
 *
 * ## Registration
 *
 * ```ts
 * CustomFields2Module.forRoot({
 *   entityTypes: [
 *     {
 *       entityType: 'donation',
 *       managePermissions: ['admin:donations'],
 *       writePermissions: ['write:donations'],
 *       readPermissions: ['read:donations'],
 *       maxFields: 20,
 *     },
 *   ],
 *   encryptionKey: process.env.CF2_ENCRYPTION_KEY,
 * })
 * ```
 *
 * ## Optional — ICustomFieldEntityAccessPort
 *
 * For record-level access (beyond permission-based checks), implement the
 * port and register: `{ provide: ICustomFieldEntityAccessPort, useClass: MyAdapter }`.
 * If not provided, record-level checks are skipped and a boot warning is logged.
 */
@Module({})
export class CustomFields2Module extends BaseDynamicModule {
  static forRoot(options: CustomFields2ModuleOptions = {}): DynamicModule {
    return CustomFields2Module._build([
      CustomFields2Module.createOptionsProvider(
        CUSTOM_FIELDS2_OPTIONS,
        CustomFields2OptionsSchema,
        options,
      ),
    ]);
  }

  static forRootAsync(options: CustomFields2ModuleAsyncOptions): DynamicModule {
    return CustomFields2Module._build([
      CustomFields2Module.createAsyncOptionsProvider(
        CUSTOM_FIELDS2_OPTIONS,
        CustomFields2OptionsSchema,
        options,
      ),
    ]);
  }

  private static _build(optionsProviders: Provider[]): DynamicModule {
    return {
      module: CustomFields2Module,
      imports: [CqrsModule],
      controllers: [
        CustomFieldDefinitionController,
        CustomFieldValueController,
      ],
      providers: [
        ...optionsProviders,
        CustomFields2EntityAccessServiceGuard,
        FieldValueCodecService,
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
      ],
      exports: [CUSTOM_FIELDS2_OPTIONS],
    };
  }
}
