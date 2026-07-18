import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import {
  WorkflowFacade,
  WORKFLOW_FORM_DATA_PORT,
  IWorkflowFormDataPort,
  WorkflowRequesterType,
} from '@ce/nestjs-shared-workflow';
import { PublicFormWorkflowAlias } from './public-form-alias.registry';

@Injectable()
export class StartPublicWorkflowService {
  constructor(
    private readonly workflowFacade: WorkflowFacade,
    @Inject(WORKFLOW_FORM_DATA_PORT)
    private readonly formDataPort: IWorkflowFormDataPort,
  ) {}

  async startFromPublicSubmission(params: {
    publicFormId: string;
    alias: PublicFormWorkflowAlias;
    values: Record<string, unknown>;
    submissionId?: string;
  }): Promise<string> {
    const submissionId = params.submissionId ?? randomUUID();

    const instance = await this.workflowFacade.startWorkflow({
      definitionId: params.alias.definitionId,
      requester: { type: WorkflowRequesterType.External, id: null },
      context: { ...params.values, definitionId: params.alias.definitionId },
      idempotencyKey: `public:${params.publicFormId}:${submissionId}`,
    });

    await this.formDataPort.saveFormData({
      instanceId: instance.id,
      elementId: 'start',
      formKey: params.alias.formKey,
      values: params.values,
      submittedById: 'public:anonymous',
      submit: true,
    });

    return instance.id;
  }
}
