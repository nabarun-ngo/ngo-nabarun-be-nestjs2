import { Injectable } from '@nestjs/common';
import {
  IJsonDocumentPayloadValidatorPort,
  JsonDocumentInvalidError,
} from '@nabarun-ngo/nestjs-shared-json-store';
import {
  formatZodValidationErrors,
  JSON_STORE_SCHEMA_REGISTRY,
  resolveJsonStoreSchema,
} from './json-store-schema.registry';

@Injectable()
export class ZodJsonDocumentPayloadValidatorAdapter implements IJsonDocumentPayloadValidatorPort {
  validate(namespace: string, key: string, payload: Record<string, unknown>): void {
    const schema = resolveJsonStoreSchema(JSON_STORE_SCHEMA_REGISTRY, namespace, key);
    if (!schema) {
      return;
    }

    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new JsonDocumentInvalidError(
        `Payload validation failed for ${namespace}/${key}: ${formatZodValidationErrors(result.error)}`,
      );
    }
  }
}

export const JSON_DOCUMENT_PAYLOAD_VALIDATOR_PROVIDER = {
  provide: IJsonDocumentPayloadValidatorPort,
  useClass: ZodJsonDocumentPayloadValidatorAdapter,
};

