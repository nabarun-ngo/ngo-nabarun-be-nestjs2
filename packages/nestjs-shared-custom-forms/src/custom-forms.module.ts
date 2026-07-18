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
import { BaseDynamicModule, DynamicModuleAsyncOptions } from '@nabarun-ngo/nestjs-shared-core';
import {
  CustomFormsModuleOptions,
  CustomFormsOptionsSchema,
} from './custom-forms.schema';
import { CUSTOM_FORMS_OPTIONS } from './infrastructure/custom-forms-options.token';

// Domain / Ports
import { IFormEntityAccessPort } from './domain/ports/form-entity-access.port';

// Application — Commands
import { CreateFormHandler } from './application/commands/create-form/create-form.handler';
import { UpdateFormHandler } from './application/commands/update-form/update-form.handler';
import { PublishFormHandler } from './application/commands/publish-form/publish-form.handler';
import { DisableFormHandler } from './application/commands/disable-form/disable-form.handler';
import { AddFormFieldHandler } from './application/commands/add-form-field/add-form-field.handler';
import { UpdateFormFieldHandler } from './application/commands/update-form-field/update-form-field.handler';
import { DisableFormFieldHandler } from './application/commands/disable-form-field/disable-form-field.handler';
import { BulkUpdateFieldSortOrderHandler } from './application/commands/bulk-update-field-sort-order/bulk-update-field-sort-order.handler';
import { SaveFormDraftHandler } from './application/commands/save-form-draft/save-form-draft.handler';
import { SubmitFormHandler } from './application/commands/submit-form/submit-form.handler';
import { ClearFormSubmissionHandler } from './application/commands/clear-form-submission/clear-form-submission.handler';

// Application — Queries
import { ListFormsHandler } from './application/queries/list-forms/list-forms.handler';
import { GetFormWithFieldsHandler } from './application/queries/get-form-with-fields/get-form-with-fields.handler';
import { GetFormSubmissionHandler } from './application/queries/get-form-submission/get-form-submission.handler';
import { ValidateFormSubmissionHandler } from './application/queries/validate-form-submission/validate-form-submission.handler';
import { GetFormSubmissionHistoryHandler } from './application/queries/get-form-submission-history/get-form-submission-history.handler';

// Infrastructure — Services
import { FieldValueCodecService } from './infrastructure/services/field-value-codec.service';

// Presentation
import { FormController } from './presentation/http/form.controller';
import { FormFieldController } from './presentation/http/form-field.controller';
import { FormSubmissionController } from './presentation/http/form-submission.controller';

export interface CustomFormsModuleAsyncOptions
  extends DynamicModuleAsyncOptions<CustomFormsModuleOptions> { }

const ENTITY_ACCESS_PORT_MISSING_MSG =
  '[CustomFormsModule] IFormEntityAccessPort is not provided. ' +
  'Record-level access checks will be SKIPPED — any user with the required ' +
  'form permission can read or write all form submissions. ' +
  'Fix: implement IFormEntityAccessPort and register it with ' +
  '{ provide: IFormEntityAccessPort, useClass: MyAdapter }.';

@Injectable()
class CustomFormsEntityAccessServiceGuard implements OnApplicationBootstrap {
  private readonly logger = new Logger('CustomFormsModule');

  constructor(
    @Optional()
    @Inject(IFormEntityAccessPort)
    private readonly accessPort: IFormEntityAccessPort | null,
  ) { }

  onApplicationBootstrap(): void {
    if (this.accessPort) return;
    this.logger.warn(ENTITY_ACCESS_PORT_MISSING_MSG);
  }
}

const COMMAND_HANDLERS = [
  CreateFormHandler,
  UpdateFormHandler,
  PublishFormHandler,
  DisableFormHandler,
  AddFormFieldHandler,
  UpdateFormFieldHandler,
  DisableFormFieldHandler,
  BulkUpdateFieldSortOrderHandler,
  SaveFormDraftHandler,
  SubmitFormHandler,
  ClearFormSubmissionHandler,
];

const QUERY_HANDLERS = [
  ListFormsHandler,
  GetFormWithFieldsHandler,
  GetFormSubmissionHandler,
  ValidateFormSubmissionHandler,
  GetFormSubmissionHistoryHandler,
];

/**
 * CustomFormsModule — DDD-compliant dynamic custom forms module.
 *
 * Supports per-entity-type form definitions, field management, draft/submit
 * workflows, validation, value history, and optional record-level access.
 *
 * ## Registration
 *
 * ```ts
 * CustomFormsModule.forRoot({
 *   entityTypes: [
 *     {
 *       entityType: 'donation',
 *       managePermissions: ['admin:donations'],
 *       writePermissions: ['write:donations'],
 *       readPermissions: ['read:donations'],
 *       maxFields: 20,
 *     },
 *   ],
 *   encryptionKey: process.env.CF_ENCRYPTION_KEY,
 * })
 * ```
 *
 * ## Optional — IFormEntityAccessPort
 *
 * For record-level access (beyond permission-based checks), implement the
 * port and register: `{ provide: IFormEntityAccessPort, useClass: MyAdapter }`.
 * If not provided, record-level checks are skipped and a boot warning is logged.
 */
@Module({})
export class CustomFormsModule extends BaseDynamicModule {
  static forRoot(options: CustomFormsModuleOptions = {}): DynamicModule {
    return CustomFormsModule._build([
      CustomFormsModule.createOptionsProvider(
        CUSTOM_FORMS_OPTIONS,
        CustomFormsOptionsSchema,
        options,
      ),
    ]);
  }

  static forRootAsync(options: CustomFormsModuleAsyncOptions): DynamicModule {
    return CustomFormsModule._build([
      CustomFormsModule.createAsyncOptionsProvider(
        CUSTOM_FORMS_OPTIONS,
        CustomFormsOptionsSchema,
        options,
      ),
    ]);
  }

  private static _build(optionsProviders: Provider[]): DynamicModule {
    return {
      module: CustomFormsModule,
      imports: [CqrsModule],
      controllers: [
        FormController,
        FormFieldController,
        FormSubmissionController,
      ],
      providers: [
        ...optionsProviders,
        CustomFormsEntityAccessServiceGuard,
        FieldValueCodecService,
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
      ],
      exports: [CUSTOM_FORMS_OPTIONS],
    };
  }
}
