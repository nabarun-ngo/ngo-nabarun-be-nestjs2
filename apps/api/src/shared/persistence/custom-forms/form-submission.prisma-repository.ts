import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  FormSubmissionWhereInput,
  FormSubmissionWhereUniqueInput,
  FormSubmissionOrderByWithRelationInput,
} from '../prisma/models';
import { IFormSubmissionRepository } from '@ce/nestjs-shared-custom-forms';
import { FormSubmission } from '@ce/nestjs-shared-custom-forms/domain/aggregates/form-submission/form-submission.aggregate';
import { FormFieldValue } from '@ce/nestjs-shared-custom-forms/domain/entities/form-field-value/form-field-value.entity';
import { FormFieldValueHistoryEntry } from '@ce/nestjs-shared-custom-forms/domain/entities/form-field-value-history-entry/form-field-value-history-entry.entity';
import { FormSubmissionStatus } from '@ce/nestjs-shared-custom-forms/domain/enums/form-submission-status.enum';
import { FormSubmissionFilter } from '@ce/nestjs-shared-custom-forms/domain/repositories/form-submission.repository';

type FormFieldValueHistoryRow = {
  id: string;
  formFieldValueId: string;
  entityType: string;
  entityId: string;
  formId: string;
  fieldDefId: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  createdAt: Date;
};

type FormFieldValueRow = {
  id: string;
  entityType: string;
  entityId: string;
  formId: string;
  formSubmissionId: string;
  fieldDefId: string;
  value: string | null;
  createdAt: Date;
  updatedAt: Date;
  historyEntries?: FormFieldValueHistoryRow[];
};

type FormSubmissionRow = {
  id: string;
  entityType: string;
  entityId: string;
  formId: string;
  status: string;
  submittedAt: Date | null;
  submittedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  fieldValues?: FormFieldValueRow[];
};

const INCLUDE_FIELD_VALUES = {
  fieldValues: {
    orderBy: { createdAt: 'asc' },
    include: { historyEntries: { orderBy: { createdAt: 'asc' } } },
  },
} as const;

@Injectable()
export class FormSubmissionPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'formSubmission',
    FormSubmission,
    string,
    FormSubmissionFilter,
    FormSubmissionRow,
    FormSubmissionWhereInput,
    FormSubmissionWhereUniqueInput,
    any,
    any,
    FormSubmissionOrderByWithRelationInput
  >
  implements IFormSubmissionRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'formSubmission');
  }

  // ── IFormSubmissionRepository ─────────────────────────────────────────────

  async findByEntity(
    entityType: string,
    entityId: string,
    formId: string,
  ): Promise<FormSubmission | null> {
    const row = await (this.delegate).findFirst({
      where: { entityType, entityId, formId },
      include: INCLUDE_FIELD_VALUES,
    });
    return row ? this.toDomain(row as FormSubmissionRow) : null;
  }

  async upsertDraft(
    entityType: string,
    entityId: string,
    formId: string,
    values: Array<{ fieldDefId: string; value: string | null; changedBy: string }>,
  ): Promise<FormSubmission> {
    let submission = await this.findByEntity(entityType, entityId, formId);
    const isNew = !submission;

    if (!submission) {
      submission = FormSubmission.create({ entityType, entityId, formId });
    }

    if (values.length > 0) {
      submission.saveDraft(values);
    }

    if (isNew) {
      await (this.delegate).create({
        data: {
          id:         submission.id,
          entityType,
          entityId,
          formId,
          status:     submission.status,
          createdAt:  submission.createdAt ?? new Date(),
          updatedAt:  new Date(),
        },
      });
    }

    if (values.length > 0) {
      const client = this.database.client;

      for (const entry of values) {
        const fieldValue = submission.fieldValues.find(
          (v) => v.fieldDefId === entry.fieldDefId,
        );
        if (!fieldValue) continue;

        const existing = await client.formFieldValue.findFirst({
          where: { entityType, entityId, formId, fieldDefId: entry.fieldDefId },
        }) as FormFieldValueRow | null;

        if (existing) {
          if (existing.value !== entry.value) {
            await client.formFieldValue.update({
              where: { id: existing.id },
              data: {
                value:     entry.value,
                updatedAt: new Date(),
                historyEntries: {
                  create: {
                    formId,
                    fieldDefId: entry.fieldDefId,
                    entityType,
                    entityId,
                    oldValue:   existing.value,
                    newValue:   entry.value,
                    changedBy:  entry.changedBy,
                    createdAt:  new Date(),
                  },
                },
              },
            });
          }
        } else {
          await client.formFieldValue.create({
            data: {
              id:               fieldValue.id,
              entityType,
              entityId,
              formId,
              formSubmissionId: submission.id,
              fieldDefId:       entry.fieldDefId,
              value:            entry.value,
              createdAt:        fieldValue.createdAt ?? new Date(),
              updatedAt:        new Date(),
              historyEntries: entry.value !== null
                ? {
                    create: {
                      formId,
                      fieldDefId: entry.fieldDefId,
                      entityType,
                      entityId,
                      oldValue:  null,
                      newValue:  entry.value,
                      changedBy: entry.changedBy,
                      createdAt: new Date(),
                    },
                  }
                : undefined,
            },
          });
        }
      }

      await (this.delegate).update({
        where: { id: submission.id },
        data:  { updatedAt: new Date() },
      });
    }

    return submission;
  }

  async clearByEntity(
    entityType: string,
    entityId: string,
    formId: string,
  ): Promise<void> {
    await (this.delegate).deleteMany({ where: { entityType, entityId, formId } });
  }

  async findHistoryByEntity(
    entityType: string,
    entityId: string,
    formId: string,
    fieldDefId?: string,
  ): Promise<FormFieldValueHistoryEntry[]> {
    const rows = await (this.database.client).formFieldValueHistoryEntry.findMany({
      where: {
        entityType,
        entityId,
        formId,
        ...(fieldDefId ? { fieldDefId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    }) as FormFieldValueHistoryRow[];

    return rows.map(
      (row) =>
        new FormFieldValueHistoryEntry(
          row.id,
          row.formId,
          row.fieldDefId,
          row.entityType,
          row.entityId,
          row.oldValue,
          row.newValue,
          row.changedBy,
          row.createdAt,
        ),
    );
  }

  // ── PrismaCrudRepositoryBase mapping hooks ───────────────────────────────

  protected toDomain(row: FormSubmissionRow): FormSubmission {
    const fieldValues = (row.fieldValues ?? []).map((fv) => this.toFieldValueDomain(fv));

    return new FormSubmission(
      row.id,
      row.entityType,
      row.entityId,
      row.formId,
      row.status as FormSubmissionStatus,
      fieldValues,
      row.createdAt,
      row.updatedAt ?? undefined,
      row.submittedAt ?? undefined,
      row.submittedBy ?? undefined,
    );
  }

  private toFieldValueDomain(row: FormFieldValueRow): FormFieldValue {
    const history = (row.historyEntries ?? []).map(
      (h) =>
        new FormFieldValueHistoryEntry(
          h.id,
          h.formId,
          h.fieldDefId,
          h.entityType,
          h.entityId,
          h.oldValue,
          h.newValue,
          h.changedBy,
          h.createdAt,
        ),
    );

    return new FormFieldValue(
      row.id,
      row.entityType,
      row.entityId,
      row.formId,
      row.fieldDefId,
      row.value,
      history,
      row.createdAt,
      row.updatedAt ?? undefined,
    );
  }

  protected toCreateInput(entity: FormSubmission): any {
    return {
      id:         entity.id,
      entityType: entity.entityType,
      entityId:   entity.entityId,
      formId:     entity.formId,
      status:     entity.status,
      createdAt:  entity.createdAt ?? new Date(),
      updatedAt:  entity.updatedAt ?? new Date(),
    };
  }

  protected toUpdateInput(_id: string, entity: FormSubmission): any {
    return {
      status:      entity.status,
      submittedAt: entity.submittedAt ?? null,
      submittedBy: entity.submittedBy ?? null,
      updatedAt:   entity.updatedAt ?? new Date(),
    };
  }

  protected toUniqueWhere(id: string): FormSubmissionWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: FormSubmissionFilter): FormSubmissionWhereInput {
    return {
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.entityId   ? { entityId:   filter.entityId }   : {}),
      ...(filter?.formId     ? { formId:     filter.formId }     : {}),
    };
  }

  protected defaultOrderBy(): FormSubmissionOrderByWithRelationInput {
    return { createdAt: 'asc' };
  }
}
