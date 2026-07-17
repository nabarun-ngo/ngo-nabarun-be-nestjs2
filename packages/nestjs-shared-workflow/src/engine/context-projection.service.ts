import { Injectable } from '@nestjs/common';
import type { WorkflowFormDataSnapshot } from '../domain/ports/workflow-form-data.port';

@Injectable()
export class ContextProjectionService {
  mergeFormData(
    context: Record<string, unknown>,
    formData: WorkflowFormDataSnapshot | Record<string, unknown>,
  ): Record<string, unknown> {
    const values: Record<string, unknown> =
      'values' in formData && formData.values && typeof formData.values === 'object'
        ? (formData.values as Record<string, unknown>)
        : (formData as Record<string, unknown>);

    const existingForm =
      context.form && typeof context.form === 'object'
        ? (context.form as Record<string, unknown>)
        : {};

    return {
      ...context,
      form: {
        ...existingForm,
        ...values,
      },
      ...values,
    };
  }

  projectServiceTaskInput(
    context: Record<string, unknown>,
    inputMapping?: Record<string, string>,
  ): Record<string, unknown> {
    if (!inputMapping) {
      return { ...context };
    }

    const input: Record<string, unknown> = {};
    for (const [targetKey, sourceExpression] of Object.entries(inputMapping)) {
      input[targetKey] = this.resolveMappingValue(sourceExpression, context);
    }
    return input;
  }

  private resolveMappingValue(
    expression: string,
    context: Record<string, unknown>,
  ): unknown {
    if (expression.startsWith('context.')) {
      const path = expression.slice('context.'.length).split('.');
      let current: unknown = context;
      for (const segment of path) {
        if (current == null || typeof current !== 'object') {
          return undefined;
        }
        current = (current as Record<string, unknown>)[segment];
      }
      return current;
    }
    return context[expression];
  }
}
