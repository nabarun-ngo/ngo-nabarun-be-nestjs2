import { JsonStoreSeedData } from './json-store-seed.types';
import { IJsonDocumentPayloadValidatorPort } from '../../domain/ports/json-document-payload-validator.port';

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
