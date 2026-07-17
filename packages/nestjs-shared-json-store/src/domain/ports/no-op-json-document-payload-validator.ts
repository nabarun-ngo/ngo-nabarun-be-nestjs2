import { Injectable } from '@nestjs/common';
import { IJsonDocumentPayloadValidatorPort } from './json-document-payload-validator.port';

@Injectable()
export class NoOpJsonDocumentPayloadValidator implements IJsonDocumentPayloadValidatorPort {
  validate(): void {
    // Permissive default — no schema registered means no validation.
  }
}
