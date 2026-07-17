import { generateUniqueNDigitNumber } from '@ce/nestjs-shared-core';

export function generateWorkflowInstanceId(): string {
  return `NW${generateUniqueNDigitNumber(10)}`;
}
