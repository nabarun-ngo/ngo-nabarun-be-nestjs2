import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { UserReferenceDataPayloadSchema } from './user-reference-data.schema';

const userReferenceDataSeedDir = join(__dirname, '../../../prisma/seeds/json-store/user-reference-data');

describe('UserReferenceDataPayloadSchema', () => {
  it('accepts payloads with _comment metadata', () => {
    const result = UserReferenceDataPayloadSchema.safeParse({
      _comment: 'Salutation titles',
      items: [{ key: 'MR', value: 'Mr.' }],
    });

    expect(result.success).toBe(true);
  });

  it('rejects payloads without items', () => {
    const result = UserReferenceDataPayloadSchema.safeParse({
      _comment: 'missing items',
    });

    expect(result.success).toBe(false);
  });

  it('validates all user-reference-data seed files', () => {
    const files = readdirSync(userReferenceDataSeedDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const payload = JSON.parse(readFileSync(join(userReferenceDataSeedDir, file), 'utf-8'));
      const result = UserReferenceDataPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    }
  });
});
