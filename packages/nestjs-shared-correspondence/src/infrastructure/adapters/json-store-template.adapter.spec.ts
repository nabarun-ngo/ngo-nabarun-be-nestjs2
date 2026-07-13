/**
 * JsonStoreTemplateAdapter unit tests.
 * Mocks JsonStoreFacade to verify template retrieval and mapping.
 */

// Mock axios and @nestjs/axios to avoid missing peer dependency in transitive imports
jest.mock('axios', () => ({}), { virtual: true });
jest.mock('@nestjs/axios', () => ({ HttpModule: class {}, HttpService: class {} }), {
  virtual: true,
});

import { JsonStoreTemplateAdapter } from '@ce/nestjs-shared-correspondence/infrastructure/adapters/json-store-template.adapter';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';

function buildAdapter(storeData: Record<string, any> | null = null) {
  const jsonStore: jest.Mocked<JsonStoreFacade> = {
    get: jest.fn().mockResolvedValue(storeData),
    set: jest.fn(),
    delete: jest.fn(),
  } as any;

  const adapter = new JsonStoreTemplateAdapter(jsonStore);
  return { adapter, jsonStore };
}

describe('JsonStoreTemplateAdapter', () => {
  it('calls jsonStore.get with key and correspondence namespace', async () => {
    const { adapter, jsonStore } = buildAdapter(null);
    await adapter.findByKey('welcome-email');
    expect(jsonStore.get).toHaveBeenCalledWith('welcome-email', 'correspondence');
  });

  it('returns null when template not found in store', async () => {
    const { adapter } = buildAdapter(null);
    const result = await adapter.findByKey('missing-key');
    expect(result).toBeNull();
  });

  it('returns null when store entry has no htmlTemplate', async () => {
    const { adapter } = buildAdapter({ subject: 'Hello' });
    const result = await adapter.findByKey('bad-template');
    expect(result).toBeNull();
  });

  it('maps subject and htmlTemplate from store data', async () => {
    const { adapter } = buildAdapter({
      subject: 'Welcome!',
      htmlTemplate: '<p>Hello {{name}}</p>',
    });
    const result = await adapter.findByKey('welcome');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('Welcome!');
    expect(result!.htmlTemplate).toBe('<p>Hello {{name}}</p>');
  });

  it('maps optional textTemplate when present', async () => {
    const { adapter } = buildAdapter({
      subject: 'S',
      htmlTemplate: '<p></p>',
      textTemplate: 'Hello plain text',
    });
    const result = await adapter.findByKey('tmpl');
    expect(result!.textTemplate).toBe('Hello plain text');
  });

  it('maps optional defaultData when present', async () => {
    const defaultData = { appName: 'TestApp', supportEmail: 'support@test.com' };
    const { adapter } = buildAdapter({
      subject: 'S',
      htmlTemplate: '<p></p>',
      defaultData,
    });
    const result = await adapter.findByKey('tmpl');
    expect(result!.defaultData).toEqual(defaultData);
  });

  it('textTemplate is undefined when not in store', async () => {
    const { adapter } = buildAdapter({ subject: 'S', htmlTemplate: '<p></p>' });
    const result = await adapter.findByKey('tmpl');
    expect(result!.textTemplate).toBeUndefined();
  });

  it('defaultData is undefined when not in store', async () => {
    const { adapter } = buildAdapter({ subject: 'S', htmlTemplate: '<p></p>' });
    const result = await adapter.findByKey('tmpl');
    expect(result!.defaultData).toBeUndefined();
  });
});
