import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import {
  IFormRepository,
  SaveFormDraftCommand,
  SubmitFormCommand,
  ValidateFormSubmissionQuery,
} from '@ce/nestjs-shared-custom-forms';
import { Form } from '@ce/nestjs-shared-custom-forms/domain/aggregates/form/form.aggregate';
import { CustomFieldType } from '@ce/nestjs-shared-custom-forms/domain/enums/custom-field-type.enum';
import { FormStatus } from '@ce/nestjs-shared-custom-forms/domain/enums/form-status.enum';
import {
  FormDisabledError,
  FormNotFoundError,
} from '@ce/nestjs-shared-custom-forms/domain/errors/form.errors';
import {
  resolvePublicFormEntityType,
  resolvePublicFormLookupKey,
} from './public-form-alias.registry';

const PUBLIC_USER_ID = 'public:anonymous';
const PUBLIC_PERMISSIONS: string[] = [];

@Injectable()
export class PublicFormValidatorService {
  constructor(
    @Inject(IFormRepository)
    private readonly formRepo: IFormRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async loadPublishedForm(publicFormId: string): Promise<Form> {
    const entityType = resolvePublicFormEntityType(publicFormId);
    const lookupKey = resolvePublicFormLookupKey(publicFormId);
    const form = await this.formRepo.findByKey(entityType, lookupKey);

    if (!form || form.status === FormStatus.Disabled) {
      throw new FormNotFoundError(publicFormId);
    }
    if (form.status !== FormStatus.Published) {
      throw new FormDisabledError(form.id);
    }

    return form;
  }

  sanitizeAndCoerce(form: Form, rawValues: Record<string, unknown>): Record<string, unknown> {
    const enabledKeys = new Set(form.fields.filter((f) => f.enabled).map((f) => f.key));
    const unknown = Object.keys(rawValues).filter((k) => !enabledKeys.has(k));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown fields: ${unknown.join(', ')}`);
    }

    const coerced: Record<string, unknown> = {};
    for (const field of form.fields) {
      if (!field.enabled) continue;
      if (!Object.prototype.hasOwnProperty.call(rawValues, field.key)) continue;

      const raw = rawValues[field.key];
      if (field.fieldType === CustomFieldType.Number && typeof raw === 'string') {
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          throw new BadRequestException(`Field "${field.key}" must be a numeric value`);
        }
        coerced[field.key] = num;
      } else {
        coerced[field.key] = raw;
      }
    }

    return coerced;
  }

  async validateAndPersistGenericForm(params: {
    publicFormId: string;
    values: Record<string, unknown>;
  }): Promise<string> {
    const form = await this.loadPublishedForm(params.publicFormId);
    const values = this.sanitizeAndCoerce(form, params.values);
    const entityId = randomUUID();

    await this.commandBus.execute(
      new SaveFormDraftCommand(
        form.id,
        resolvePublicFormEntityType(params.publicFormId),
        entityId,
        values,
        PUBLIC_USER_ID,
        PUBLIC_PERMISSIONS,
      ),
    );

    const validation = await this.queryBus.execute(
      new ValidateFormSubmissionQuery(
        form.id,
        resolvePublicFormEntityType(params.publicFormId),
        entityId,
        PUBLIC_PERMISSIONS,
      ),
    );

    if (!validation.valid) {
      const messages = [
        ...validation.missingMandatory.map((k) => `${k} is required`),
        ...validation.validationViolations.map((k) => `${k} failed validation`),
        ...validation.conditionViolations.map((k) => `${k} condition not satisfied`),
      ];
      throw new BadRequestException(messages.join('; ') || 'Validation failed');
    }

    await this.commandBus.execute(
      new SubmitFormCommand(
        form.id,
        resolvePublicFormEntityType(params.publicFormId),
        entityId,
        values,
        PUBLIC_USER_ID,
        PUBLIC_PERMISSIONS,
      ),
    );

    return entityId;
  }

  async validateForWorkflow(params: {
    publicFormId: string;
    values: Record<string, unknown>;
  }): Promise<{ form: Form; values: Record<string, unknown> }> {
    const form = await this.loadPublishedForm(params.publicFormId);
    const values = this.sanitizeAndCoerce(form, params.values);
    const entityId = `__validate__:${form.id}:${Date.now()}`;

    await this.commandBus.execute(
      new SaveFormDraftCommand(
        form.id,
        resolvePublicFormEntityType(params.publicFormId),
        entityId,
        values,
        PUBLIC_USER_ID,
        PUBLIC_PERMISSIONS,
      ),
    );

    const validation = await this.queryBus.execute(
      new ValidateFormSubmissionQuery(
        form.id,
        resolvePublicFormEntityType(params.publicFormId),
        entityId,
        PUBLIC_PERMISSIONS,
      ),
    );

    if (!validation.valid) {
      const messages = [
        ...validation.missingMandatory.map((k) => `${k} is required`),
        ...validation.validationViolations.map((k) => `${k} failed validation`),
        ...validation.conditionViolations.map((k) => `${k} condition not satisfied`),
      ];
      throw new BadRequestException(messages.join('; ') || 'Validation failed');
    }

    return { form, values };
  }
}
