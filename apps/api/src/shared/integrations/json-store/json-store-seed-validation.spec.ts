import { join } from 'path';
import { loadJsonStoreSeedFromDir, validateJsonStoreSeedData } from '@ce/nestjs-shared-json-store';
import { ZodJsonDocumentPayloadValidatorAdapter } from './json-document-payload-validator.adapter';

const jsonStoreSeedDir = join(__dirname, '../../../prisma/seeds/json-store');

describe('json-store seed validation', () => {
  it('validates all loaded seed documents against the schema registry', () => {
    const data = loadJsonStoreSeedFromDir(jsonStoreSeedDir);

    expect(() =>
      validateJsonStoreSeedData(data, new ZodJsonDocumentPayloadValidatorAdapter()),
    ).not.toThrow();
  });
});
