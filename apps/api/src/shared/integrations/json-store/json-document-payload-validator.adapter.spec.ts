import { z } from 'zod';
import { JsonDocumentInvalidError } from '@ce/nestjs-shared-json-store';
import { ZodJsonDocumentPayloadValidatorAdapter } from './json-document-payload-validator.adapter';
import {
  formatZodValidationErrors,
  JSON_STORE_SCHEMA_REGISTRY,
  resolveJsonStoreSchema,
} from './json-store-schema.registry';

describe('resolveJsonStoreSchema', () => {
  it('resolves namespace-level schemas', () => {
    expect(resolveJsonStoreSchema(JSON_STORE_SCHEMA_REGISTRY, 'correspondence', 'any-key')).toBe(
      JSON_STORE_SCHEMA_REGISTRY.correspondence,
    );
  });

  it('prefers namespace:key overrides when present', () => {
    const registry = {
      correspondence: z.object({ type: z.literal('default') }),
      'correspondence:special': z.object({ type: z.literal('override') }),
    };

    expect(resolveJsonStoreSchema(registry, 'correspondence', 'special')).toBe(
      registry['correspondence:special'],
    );
    expect(resolveJsonStoreSchema(registry, 'correspondence', 'other')).toBe(registry.correspondence);
  });

  it('returns undefined for unknown namespaces', () => {
    expect(resolveJsonStoreSchema(JSON_STORE_SCHEMA_REGISTRY, 'unknown', 'key')).toBeUndefined();
  });
});

describe('formatZodValidationErrors', () => {
  it('formats issue paths and messages', () => {
    const result = z.object({ htmlTemplate: z.string().min(1) }).safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodValidationErrors(result.error)).toContain('htmlTemplate');
    }
  });
});

describe('ZodJsonDocumentPayloadValidatorAdapter', () => {
  const validator = new ZodJsonDocumentPayloadValidatorAdapter();

  it('throws JsonDocumentInvalidError for invalid correspondence payloads', () => {
    expect(() =>
      validator.validate('correspondence', 'welcome-email', { subject: 'Hello' }),
    ).toThrow(JsonDocumentInvalidError);
  });

  it('allows valid correspondence payloads', () => {
    expect(() =>
      validator.validate('correspondence', 'welcome-email', {
        subject: 'Welcome',
        htmlTemplate: '<p>Hi</p>',
      }),
    ).not.toThrow();
  });

  it('skips validation for unknown namespaces', () => {
    expect(() =>
      validator.validate('config', 'feature-flags', { invalid: true }),
    ).not.toThrow();
  });
});
