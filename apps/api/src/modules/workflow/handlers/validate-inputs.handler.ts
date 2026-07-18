import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import {
  WorkflowTaskHandler,
  WorkflowTaskHandlerContract,
} from '@nabarun-ngo/nestjs-shared-workflow';

const REQUIRED_BY_DEFINITION: Record<string, string[]> = {
  JOIN_REQUEST: ['firstName', 'lastName', 'email', 'contactNumber', 'hometown'],
  CONTACT_REQUEST: ['fullName', 'email', 'contactNumber', 'subject', 'message'],
  ...loadGeneratedRequiredFields(),
};

function loadGeneratedRequiredFields(): Record<string, string[]> {
  try {
    const manifestPath = join(
      __dirname,
      '../../../../prisma/seeds/workflow-forms.generated.json',
    );
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      requiredFields?: Record<string, string[]>;
    };
    return raw.requiredFields ?? {};
  } catch {
    return {};
  }
}

@Injectable()
@WorkflowTaskHandler('ValidateInputs')
export class ValidateInputsHandler implements WorkflowTaskHandlerContract {
  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<void> {
    const workflowType =
      typeof params.input.definitionId === 'string'
        ? params.input.definitionId
        : typeof params.input.workflowType === 'string'
          ? params.input.workflowType
          : null;

    const required: string[] =
      workflowType && REQUIRED_BY_DEFINITION[workflowType]
        ? REQUIRED_BY_DEFINITION[workflowType]
        : Object.keys(params.input).filter((k) => !k.startsWith('_'));

    const missing = required.filter(
      (key) => params.input[key] == null || params.input[key] === '',
    );

    if (missing.length > 0) {
      throw new BusinessException(`Missing or empty required fields: ${missing.join(', ')}`);
    }
  }
}
