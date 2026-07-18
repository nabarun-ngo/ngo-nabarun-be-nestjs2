import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@nabarun-ngo/nestjs-shared-persistence';
import { PrismaClient } from '../prisma/client';
import {
  FormWhereInput,
  FormWhereUniqueInput,
  FormOrderByWithRelationInput,
  FormCreateInput,
  FormUpdateInput,
} from '../prisma/models';
import { IFormRepository } from '@nabarun-ngo/nestjs-shared-custom-forms';
import { Form } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/aggregates/form/form.aggregate';
import { FormFieldDefinition } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/entities/form-field-definition/form-field-definition.entity';
import { FormStatus } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/enums/form-status.enum';
import { CustomFieldType } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/enums/custom-field-type.enum';
import { FieldOption } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/value-objects/field-option/field-option.vo';
import { FieldCondition } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/value-objects/dependent-options/dependent-options.vo';
import { FieldValidationRules } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/value-objects/field-validation-rules/field-validation-rules.vo';
import { FormFilter } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/repositories/form.repository';

type FormFieldDefinitionRow = {
  id: string;
  formId: string;
  key: string;
  label: string;
  fieldType: string;
  mandatory: boolean;
  fieldOptionsJson: string | null;
  isHidden: boolean;
  isEncrypted: boolean;
  enabled: boolean;
  sortOrder: number;
  conditionJson: string | null;
  dependentOptionsJson: string | null;
  validationRulesJson: string | null;
  viewPermissions: string[];
  createdBy: string | null;
  disabledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type FormRow = {
  id: string;
  entityType: string;
  key: string;
  label: string;
  description: string | null;
  status: string;
  managePermissions: string[];
  readPermissions: string[];
  writePermissions: string[];
  createdBy: string | null;
  publishedBy: string | null;
  disabledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  fields?: FormFieldDefinitionRow[];
};

const INCLUDE_FIELDS = { fields: { orderBy: { sortOrder: 'asc' } } } as const;

@Injectable()
export class FormPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'form',
    Form,
    string,
    FormFilter,
    FormRow,
    FormWhereInput,
    FormWhereUniqueInput,
    FormCreateInput,
    FormUpdateInput,
    FormOrderByWithRelationInput
  >
  implements IFormRepository {
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'form');
  }

  // ── IFormRepository ───────────────────────────────────────────────────────

  async findByKey(entityType: string, key: string): Promise<Form | null> {
    const row = await (this.delegate).findFirst({
      where: { entityType, key },
    });
    return row ? this.toDomain(row as FormRow) : null;
  }

  async findByEntityType(
    entityType: string,
    options?: { status?: FormStatus; includeDisabled?: boolean },
  ): Promise<Form[]> {
    const where: FormWhereInput = { entityType };

    if (options?.status) {
      where.status = options.status;
    } else if (options?.includeDisabled === false) {
      where.status = { not: FormStatus.Disabled };
    }

    const rows = await (this.delegate).findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return (rows as FormRow[]).map((row) => this.toDomain(row));
  }

  async findByIdWithFields(formId: string): Promise<Form | null> {
    const row = await (this.delegate).findUnique({
      where: { id: formId },
      include: INCLUDE_FIELDS,
    });
    return row ? this.toDomain(row as unknown as FormRow) : null;
  }

  async findById(id: string): Promise<Form | null> {
    const row = await (this.delegate).findUnique({
      where: { id },
    });
    return row ? this.toDomain(row as FormRow) : null;
  }

  async create(entity: Form): Promise<Form> {
    const data = this.toCreateInput(entity) as Record<string, unknown>;
    const row = await (this.delegate).create({ data: data as any });
    return this.toDomain(row as FormRow);
  }

  async update(id: string, entity: Form): Promise<Form> {
    const client = this.database.client;

    await client.$transaction(async (tx) => {
      await tx.form.update({
        where: { id },
        data: this.toUpdateInput(id, entity),
      });

      for (const field of entity.fields) {
        await tx.formFieldDefinition.upsert({
          where: { id: field.id },
          create: this.toFieldCreateInput(field),
          update: this.toFieldUpdateInput(field),
        });
      }
    });

    const updated = await this.findByIdWithFields(id);
    return updated!;
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Forms cannot be deleted');
  }

  // ── PrismaCrudRepositoryBase mapping hooks ───────────────────────────────

  protected toDomain(row: FormRow): Form {
    const fields = (row.fields ?? []).map((fieldRow) => this.toFieldDomain(fieldRow));

    return new Form(
      row.id,
      row.entityType,
      row.key,
      row.label,
      row.description,
      row.status as FormStatus,
      row.managePermissions,
      row.readPermissions,
      row.writePermissions,
      fields,
      row.createdAt,
      row.updatedAt ?? undefined,
      row.createdBy ?? undefined,
      row.publishedBy ?? undefined,
      row.disabledBy ?? undefined,
    );
  }

  private toFieldDomain(row: FormFieldDefinitionRow): FormFieldDefinition {
    const fieldOptions: FieldOption[] = row.fieldOptionsJson
      ? (JSON.parse(row.fieldOptionsJson) as Array<{ key: string; label: string }>).map(
        (o) => FieldOption.of(o.key, o.label),
      )
      : [];

    const condition: FieldCondition | null = row.conditionJson
      ? (() => {
        const c = JSON.parse(row.conditionJson) as {
          dependsOnKey: string;
          operator: 'equals' | 'not_equals' | 'in' | 'not_in';
          value: string | number | boolean | string[];
        };
        return FieldCondition.of(c.dependsOnKey, c.operator, c.value);
      })()
      : null;

    const dependentOptions: DependentOptions | null = row.dependentOptionsJson
      ? (() => {
        const d = JSON.parse(row.dependentOptionsJson) as {
          dependsOnKey: string;
          optionMap: Record<string, Array<{ key: string; label: string }>>;
        };
        const optionMap = Object.fromEntries(
          Object.entries(d.optionMap).map(([k, opts]) => [
            k,
            opts.map((o) => FieldOption.of(o.key, o.label)),
          ]),
        );
        return DependentOptions.of(d.dependsOnKey, optionMap);
      })()
      : null;

    const validationRules: FieldValidationRules | null = row.validationRulesJson
      ? (() => {
        const v = JSON.parse(row.validationRulesJson) as {
          pattern: string;
          regexErrMsg?: string;
        };
        return FieldValidationRules.fromPersisted(v.pattern, v.regexErrMsg);
      })()
      : null;

    const viewPermissions: string[] = row.viewPermissions;

    return new FormFieldDefinition(
      row.id,
      row.formId,
      row.key,
      row.label,
      row.fieldType as CustomFieldType,
      row.mandatory,
      fieldOptions,
      row.isHidden,
      row.isEncrypted,
      row.enabled,
      row.sortOrder,
      condition,
      dependentOptions,
      row.createdAt,
      row.updatedAt ?? undefined,
      row.createdBy ?? undefined,
      row.disabledBy ?? undefined,
      viewPermissions,
      validationRules,
    );
  }

  protected toCreateInput(entity: Form): FormCreateInput {
    return {
      id: entity.id,
      entityType: entity.entityType,
      key: entity.key,
      label: entity.label,
      description: entity.description,
      status: entity.status,
      managePermissions: [...entity.managePermissions],
      readPermissions: [...entity.readPermissions],
      writePermissions: [...entity.writePermissions],
      createdBy: entity.createdBy ?? null,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  protected toUpdateInput(_id: string, entity: Form): FormUpdateInput {
    return {
      label: entity.label,
      description: entity.description,
      status: entity.status,
      managePermissions: [...entity.managePermissions],
      readPermissions: [...entity.readPermissions],
      writePermissions: [...entity.writePermissions],
      publishedBy: entity.publishedBy ?? null,
      disabledBy: entity.disabledBy ?? null,
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  private toFieldCreateInput(field: FormFieldDefinition): any {
    return {
      id: field.id,
      formId: field.formId,
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      mandatory: field.mandatory,
      fieldOptionsJson: this.serialiseFieldOptions(field),
      isHidden: field.isHidden,
      isEncrypted: field.isEncrypted,
      enabled: field.enabled,
      sortOrder: field.sortOrder,
      conditionJson: this.serialiseCondition(field),
      dependentOptionsJson: this.serialiseDependentOptions(field),
      validationRulesJson: this.serialiseValidationRules(field),
      viewPermissionsJson: this.serialiseViewPermissions(field),
      createdBy: field.createdBy ?? null,
      createdAt: field.createdAt ?? new Date(),
      updatedAt: field.updatedAt ?? new Date(),
    };
  }

  private toFieldUpdateInput(field: FormFieldDefinition): any {
    return {
      label: field.label,
      fieldType: field.fieldType,
      mandatory: field.mandatory,
      fieldOptionsJson: this.serialiseFieldOptions(field),
      isHidden: field.isHidden,
      isEncrypted: field.isEncrypted,
      enabled: field.enabled,
      sortOrder: field.sortOrder,
      conditionJson: this.serialiseCondition(field),
      dependentOptionsJson: this.serialiseDependentOptions(field),
      validationRulesJson: this.serialiseValidationRules(field),
      viewPermissionsJson: this.serialiseViewPermissions(field),
      disabledBy: field.disabledBy ?? null,
      updatedAt: field.updatedAt ?? new Date(),
    };
  }

  private serialiseFieldOptions(field: FormFieldDefinition): string | null {
    return field.fieldOptions.length
      ? JSON.stringify([...field.fieldOptions].map((o) => ({ key: o.key, label: o.label })))
      : null;
  }

  private serialiseCondition(field: FormFieldDefinition): string | null {
    return field.condition
      ? JSON.stringify({
        dependsOnKey: field.condition.dependsOnKey,
        operator: field.condition.operator,
        value: field.condition.value,
      })
      : null;
  }

  private serialiseDependentOptions(field: FormFieldDefinition): string | null {
    return field.dependentOptions
      ? JSON.stringify({
        dependsOnKey: field.dependentOptions.dependsOnKey,
        optionMap: Object.fromEntries(
          Object.entries(field.dependentOptions.optionMap).map(
            ([k, opts]: [string, ReadonlyArray<FieldOption>]) => [
              k,
              [...opts].map((o) => ({ key: o.key, label: o.label })),
            ],
          ),
        ),
      })
      : null;
  }

  private serialiseValidationRules(field: FormFieldDefinition): string | null {
    return field.validationRules
      ? JSON.stringify({
        pattern: field.validationRules.pattern,
        ...(field.validationRules.regexErrMsg
          ? { regexErrMsg: field.validationRules.regexErrMsg }
          : {}),
      })
      : null;
  }

  private serialiseViewPermissions(field: FormFieldDefinition): string | null {
    return field.viewPermissions.length
      ? JSON.stringify([...field.viewPermissions])
      : null;
  }

  protected toUniqueWhere(id: string): FormWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: FormFilter): FormWhereInput {
    return {
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.key ? { key: filter.key } : {}),
    };
  }

  protected defaultOrderBy(): FormOrderByWithRelationInput {
    return { createdAt: 'asc' };
  }
}
