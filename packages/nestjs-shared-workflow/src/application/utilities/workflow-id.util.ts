import { generateUniqueNDigitNumber } from '@nabarun-ngo/nestjs-shared-core';

export function generateWorkflowInstanceId(): string {
  return `NW${generateUniqueNDigitNumber(10)}`;
}
