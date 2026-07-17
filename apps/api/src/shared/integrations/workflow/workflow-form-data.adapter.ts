import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ClearFormSubmissionCommand,
  GetFormSubmissionQuery,
  GetFormWithFieldsQuery,
  IFormRepository,
  ResolvedFormFieldValueResponseDto,
  SaveFormDraftCommand,
  SubmitFormCommand,
  ValidateFormSubmissionQuery,
} from '@ce/nestjs-shared-custom-forms';
import {
  IWorkflowFormDataPort,
  WORKFLOW_FORM_DATA_PORT,
  WorkflowFormDataSnapshot,
} from '@ce/nestjs-shared-workflow';

const WORKFLOW_ENTITY_TYPE = 'workflow';

/** Permissions used for workflow-engine internal form delegation. */
const WORKFLOW_FORM_SERVICE_PERMISSIONS = [
  'admin:workflows',
  'read:form_submissions',
  'write:form_submissions',
  'submit:form_submissions',
];

@Injectable()
export class WorkflowFormDataAdapter implements IWorkflowFormDataPort {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(IFormRepository)
    private readonly formRepo: IFormRepository,
  ) {}

  async getFormData(params: {
    instanceId: string;
    elementId: string;
    formKey: string;
    entityType?: string;
    entityId?: string;
  }): Promise<WorkflowFormDataSnapshot | null> {
    const scope = this.resolveScope(params);
    const formId = await this.resolveFormId(params.formKey);

    const fields = await this.queryBus.execute<
      GetFormSubmissionQuery,
      ResolvedFormFieldValueResponseDto[]
    >(
      new GetFormSubmissionQuery(
        formId,
        scope.entityType,
        scope.entityId,
        WORKFLOW_FORM_SERVICE_PERMISSIONS,
      ),
    );

    if (!fields.length) return null;

    return {
      formKey: params.formKey,
      entityType: scope.entityType,
      entityId: scope.entityId,
      values: this.toValuesMap(fields),
    };
  }

  async saveFormData(params: {
    instanceId: string;
    elementId: string;
    formKey: string;
    entityType?: string;
    entityId?: string;
    values: Record<string, unknown>;
    submittedById: string;
    submit: boolean;
  }): Promise<WorkflowFormDataSnapshot> {
    const scope = this.resolveScope(params);
    const formId = await this.resolveFormId(params.formKey);
    const permissions = WORKFLOW_FORM_SERVICE_PERMISSIONS;

    if (params.submit) {
      await this.commandBus.execute(
        new SubmitFormCommand(
          formId,
          scope.entityType,
          scope.entityId,
          params.values,
          params.submittedById,
          permissions,
        ),
      );
    } else {
      await this.commandBus.execute(
        new SaveFormDraftCommand(
          formId,
          scope.entityType,
          scope.entityId,
          params.values,
          params.submittedById,
          permissions,
        ),
      );
    }

    const snapshot = await this.getFormData(params);
    return {
      formKey: params.formKey,
      entityType: scope.entityType,
      entityId: scope.entityId,
      values: snapshot?.values ?? params.values,
      submittedAt: params.submit ? new Date() : undefined,
      submittedById: params.submittedById,
    };
  }

  async validateFormData(params: {
    formKey: string;
    entityType?: string;
    values: Record<string, unknown>;
  }): Promise<{ valid: boolean; errors?: Record<string, string[]> }> {
    const entityType = params.entityType ?? WORKFLOW_ENTITY_TYPE;
    const formId = await this.resolveFormId(params.formKey);

    await this.queryBus.execute(
      new GetFormWithFieldsQuery(formId, WORKFLOW_FORM_SERVICE_PERMISSIONS),
    );

    const draftEntityId = `__validate__:${formId}:${Date.now()}`;

    await this.commandBus.execute(
      new SaveFormDraftCommand(
        formId,
        entityType,
        draftEntityId,
        params.values,
        'workflow:validator',
        WORKFLOW_FORM_SERVICE_PERMISSIONS,
      ),
    );

    try {
      const result = await this.queryBus.execute(
        new ValidateFormSubmissionQuery(
          formId,
          entityType,
          draftEntityId,
          WORKFLOW_FORM_SERVICE_PERMISSIONS,
        ),
      );

      if (result.valid) {
        return { valid: true };
      }

      return {
        valid: false,
        errors: this.mapValidationErrors(result),
      };
    } finally {
      await this.commandBus.execute(
        new ClearFormSubmissionCommand(
          formId,
          entityType,
          draftEntityId,
          'workflow:validator',
          WORKFLOW_FORM_SERVICE_PERMISSIONS,
        ),
      );
    }
  }

  private resolveScope(params: {
    instanceId: string;
    elementId: string;
    formKey: string;
    entityType?: string;
    entityId?: string;
  }): { entityType: string; entityId: string } {
    const entityType = params.entityType ?? WORKFLOW_ENTITY_TYPE;
    const entityId =
      params.entityId ??
      (params.formKey.endsWith(':request')
        ? params.instanceId
        : `${params.instanceId}:${params.elementId}`);

    return { entityType, entityId };
  }

  private async resolveFormId(formKey: string): Promise<string> {
    const form = await this.formRepo.findByKey(WORKFLOW_ENTITY_TYPE, formKey);
    return form?.id ?? formKey;
  }

  private toValuesMap(
    fields: ResolvedFormFieldValueResponseDto[],
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.value !== null && field.value !== undefined) {
        values[field.key] = field.value;
      }
    }
    return values;
  }

  private mapValidationErrors(result: {
    missingMandatory: string[];
    conditionViolations: string[];
    validationViolations: string[];
  }): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const key of result.missingMandatory) {
      errors[key] = [...(errors[key] ?? []), 'This field is required'];
    }
    for (const key of result.conditionViolations) {
      errors[key] = [...(errors[key] ?? []), 'Condition not satisfied'];
    }
    for (const key of result.validationViolations) {
      errors[key] = [...(errors[key] ?? []), 'Validation failed'];
    }

    return errors;
  }
}

export const WORKFLOW_FORM_DATA_PROVIDER = {
  provide: WORKFLOW_FORM_DATA_PORT,
  useClass: WorkflowFormDataAdapter,
};
