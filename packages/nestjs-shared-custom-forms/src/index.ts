// Module
export { CustomFormsModule } from './custom-forms.module';
export type { CustomFormsModuleAsyncOptions } from './custom-forms.module';

// Schema / Options
export {
  CustomFormsOptionsSchema,
  DEFAULT_CUSTOM_FORMS_CACHE_TTL_MS,
} from './custom-forms.schema';
export type { CustomFormsModuleOptions, EntityTypeConfig } from './custom-forms.schema';

// Options injection token
export { CUSTOM_FORMS_OPTIONS } from './infrastructure/custom-forms-options.token';

// Domain ports (for consumers to implement)
export {
  IFormEntityAccessPort,
  type FormEntityAccessAction,
} from './domain/ports/form-entity-access.port';

// Repository tokens (for record-level access port implementations that need repo DI)
export { IFormRepository } from './domain/repositories/form.repository';
export { IFormSubmissionRepository } from './domain/repositories/form-submission.repository';

// Commands (for use from sibling modules — e.g. cleanup on entity delete)
export { ClearFormSubmissionCommand } from './application/commands/clear-form-submission/clear-form-submission.command';
export { SaveFormDraftCommand } from './application/commands/save-form-draft/save-form-draft.command';
export { SubmitFormCommand } from './application/commands/submit-form/submit-form.command';

// Queries (for use from sibling modules)
export { GetFormSubmissionQuery } from './application/queries/get-form-submission/get-form-submission.query';
export { ValidateFormSubmissionQuery } from './application/queries/validate-form-submission/validate-form-submission.query';
export { GetFormWithFieldsQuery } from './application/queries/get-form-with-fields/get-form-with-fields.query';

// Response DTOs (for use from sibling modules)
export {
  FormResponseDto,
  FormFieldDefinitionResponseDto,
  ResolvedFormFieldValueResponseDto,
  FormValidationResultResponseDto,
  FormFieldValueHistoryEntryResponseDto,
  FieldOptionResponseDto,
  FieldValidationRulesResponseDto,
} from './application/dtos/response/form-response.dtos';

// Domain events (for application-level event handlers in the consuming app)
export { FormCreatedEvent } from './domain/events/form-created.event';
export { FormUpdatedEvent } from './domain/events/form-updated.event';
export { FormPublishedEvent } from './domain/events/form-published.event';
export { FormDisabledEvent } from './domain/events/form-disabled.event';
export { FormFieldAddedEvent } from './domain/events/form-field-added.event';
export { FormFieldUpdatedEvent } from './domain/events/form-field-updated.event';
export { FormFieldDisabledEvent } from './domain/events/form-field-disabled.event';
export { FormSubmittedEvent } from './domain/events/form-submitted.event';
export { FormSubmissionClearedEvent } from './domain/events/form-submission-cleared.event';
export { FormFieldValuesUpdatedEvent } from './domain/events/form-field-values-updated.event';
