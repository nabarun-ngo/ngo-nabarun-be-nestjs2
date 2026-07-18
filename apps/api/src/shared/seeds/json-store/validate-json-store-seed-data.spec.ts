import { validateJsonStoreSeedData } from './validate-json-store-seed-data';
import { JsonDocumentInvalidError } from '../../domain/errors/json-store.errors';
import { IJsonDocumentPayloadValidatorPort } from '../../domain/ports/json-document-payload-validator.port';

class RejectAllValidator implements IJsonDocumentPayloadValidatorPort {
  validate(namespace: string, key: string): void {
    throw new JsonDocumentInvalidError(`rejected ${namespace}/${key}`);
  }
}

describe('validateJsonStoreSeedData', () => {
  it('validates every document in the seed dataset', () => {
    const validator = { validate: jest.fn() };
    const data = {
      documents: [
        { namespace: 'correspondence', key: 'a', payload: { x: 1 } },
        { namespace: 'cron', key: 'b', payload: { y: 2 } },
      ],
    };

    validateJsonStoreSeedData(data, validator);

    expect(validator.validate).toHaveBeenCalledTimes(2);
    expect(validator.validate).toHaveBeenCalledWith('correspondence', 'a', { x: 1 });
    expect(validator.validate).toHaveBeenCalledWith('cron', 'b', { y: 2 });
  });

  it('propagates validation errors', () => {
    expect(() =>
      validateJsonStoreSeedData(
        { documents: [{ namespace: 'cron', key: 'bad', payload: {} }] },
        new RejectAllValidator(),
      ),
    ).toThrow(JsonDocumentInvalidError);
  });
});
