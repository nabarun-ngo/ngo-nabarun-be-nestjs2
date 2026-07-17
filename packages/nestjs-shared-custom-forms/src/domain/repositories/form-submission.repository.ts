import { IRepository } from '@ce/nestjs-shared-core';
import { FormSubmission } from '../aggregates/form-submission/form-submission.aggregate';
import { FormFieldValueHistoryEntry } from '../entities/form-field-value-history-entry/form-field-value-history-entry.entity';

export interface FormSubmissionFilter {
  entityType?: string;
  entityId?: string;
  formId?: string;
  fieldDefId?: string;
}

export const IFormSubmissionRepository = Symbol('IFormSubmissionRepository');

export interface IFormSubmissionRepository
  extends IRepository<FormSubmission, string, FormSubmissionFilter> {
  findByEntity(
    entityType: string,
    entityId: string,
    formId: string,
  ): Promise<FormSubmission | null>;

  upsertDraft(
    entityType: string,
    entityId: string,
    formId: string,
    values: Array<{ fieldDefId: string; value: string | null; changedBy: string }>,
  ): Promise<FormSubmission>;

  clearByEntity(
    entityType: string,
    entityId: string,
    formId: string,
  ): Promise<void>;

  findHistoryByEntity(
    entityType: string,
    entityId: string,
    formId: string,
    fieldDefId?: string,
  ): Promise<FormFieldValueHistoryEntry[]>;
}
