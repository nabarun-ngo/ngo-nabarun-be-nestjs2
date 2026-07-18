import { IJsonDocumentPayloadValidatorPort } from '@nabarun-ngo/nestjs-shared-json-store';
import { JsonStoreSeedData } from './json-store-seed.types';

/**
 * Validates every document in a seed dataset before persisting.
 * Uses the same validator port as runtime write handlers.
 */
export function validateJsonStoreSeedData(
  data: JsonStoreSeedData,
  validator: Pick<IJsonDocumentPayloadValidatorPort, 'validate'>,
): void {
  for (const doc of data.documents) {
    validator.validate(doc.namespace, doc.key, doc.payload);
  }
}
