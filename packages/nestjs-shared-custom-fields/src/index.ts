// Module
export { CustomFields2Module as CustomFieldsModule } from './custom-fields.module';
export type { CustomFields2ModuleAsyncOptions as CustomFieldsModuleAsyncOptions } from './custom-fields.module';

// Schema / Options
export { CustomFields2OptionsSchema as CustomFieldsOptionsSchema, DEFAULT_CUSTOM_FIELDS2_CACHE_TTL_MS as DEFAULT_CUSTOM_FIELDS_CACHE_TTL_MS } from './custom-fields.schema';
export type { CustomFields2ModuleOptions as CustomFieldsModuleOptions, EntityTypeConfig } from './custom-fields.schema';

// Options injection token
export { CUSTOM_FIELDS2_OPTIONS as CUSTOM_FIELDS_OPTIONS } from './infrastructure/custom-fields-options.token';

// Domain ports (for consumers to implement)
export {
  ICustomFieldEntityAccessPort,
  type CustomFieldAccessAction,
} from './domain/ports/entity-access.port';

// Domain enum (for use in EntityTypeConfig.allowedFieldTypes)
export { CustomFieldType } from './domain/enums/custom-field-type.enum';

// Repository tokens (for record-level access port implementations that need repo DI)
export { ICustomFieldDefinitionRepository } from './domain/repositories/custom-field-definition.repository';
export { ICustomFieldValueRepository } from './domain/repositories/custom-field-value.repository';

// Commands (for use from sibling modules — e.g. cleanup on entity delete)
export { DeleteEntityFieldValuesCommand } from './application/commands/delete-entity-field-values/delete-entity-field-values.command';
export { SetEntityFieldValuesCommand } from './application/commands/set-entity-field-values/set-entity-field-values.command';

// Queries (for use from sibling modules)
export { GetEntityFieldValuesQuery } from './application/queries/get-entity-field-values/get-entity-field-values.query';
export { ValidateEntityFieldsQuery } from './application/queries/validate-entity-fields/validate-entity-fields.query';

// Response DTOs (for use from sibling modules)
export {
  CustomFieldDefinitionResponseDto,
  ResolvedCustomFieldValueResponseDto,
  EntityFieldValidationResultResponseDto,
  CustomFieldValueHistoryEntryResponseDto,
  FieldOptionResponseDto,
} from './application/dtos/response/custom-field-response.dtos';

// Domain events (for application-level event handlers in the consuming app)
export { CustomFieldDefinitionCreatedEvent } from './domain/events/custom-field-definition-created.event';
export { CustomFieldDefinitionUpdatedEvent } from './domain/events/custom-field-definition-updated.event';
export { CustomFieldDefinitionDeactivatedEvent } from './domain/events/custom-field-definition-deactivated.event';
export { CustomFieldValuesUpdatedEvent } from './domain/events/custom-field-values-updated.event';
export { EntityFieldValuesDeletedEvent } from './domain/events/entity-field-values-deleted.event';
