import { IRepository } from '@ce/nestjs-shared-core';
import { CustomFieldDefinition } from '../aggregates/custom-field-definition/custom-field-definition.aggregate';

export interface CustomFieldDefinitionFilter {
  entityType?: string;
  active?: boolean;
  key?: string;
}

export const ICustomFieldDefinitionRepository = Symbol('ICustomFieldDefinitionRepository');

export interface ICustomFieldDefinitionRepository
  extends IRepository<CustomFieldDefinition, string, CustomFieldDefinitionFilter> {
  findByKey(entityType: string, key: string): Promise<CustomFieldDefinition | null>;
  findByEntityType(
    entityType: string,
    options?: { activeOnly?: boolean },
  ): Promise<CustomFieldDefinition[]>;
}
