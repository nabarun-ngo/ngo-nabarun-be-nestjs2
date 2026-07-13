/**
 * GmailEmailAdapter unit tests.
 * Mocks the Google Gmail API client and TokenVaultFacade.
 *
 * Note: mock functions are defined INSIDE jest.mock() factory to avoid
 * the temporal-dead-zone error caused by jest.mock() hoisting.
 */

// Intercept axios dependency pulled in transitively via auth → @nestjs/axios
jest.mock('axios', () => ({}), { virtual: true });
jest.mock('@nestjs/axios', () => ({ HttpModule: class {}, HttpService: class {} }), {
  virtual: true,
});

// Define the mock send function inside the factory to avoid hoisting TDZ issue.
jest.mock('@googleapis/gmail', () => {
  const mockSend = jest.fn().mockResolvedValue({ data: { id: 'msg-1' } });
  return {
    gmail: jest.fn().mockReturnValue({
      users: { messages: { send: mockSend } },
    }),
    __mockSend: mockSend,
  };
});

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    setCredentials: jest.fn(),
  })),
}));

import { Logger } from '@nestjs/common';
import { GmailEmailAdapter } from '@ce/nestjs-shared-correspondence/infrastructure/email/gmail-email.adapter';

// ── Helpers ────────────────────────────────────────────────────────────────

function getGmailMocks() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@googleapis/gmail');
  return {
    gmailFn: mod.gmail as jest.Mock,
    mockSend: mod.__mockSend as jest.Mock,
  };
}

const moduleOptions = {
  appName: 'TestApp',
  email: { fromAddress: 'noreply@test.com', fromName: 'Test App' },
};

function makeTokenVault(accessToken = 'fake-token') {
  return { getAccessToken: jest.fn().mockResolvedValue(accessToken) };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GmailEmailAdapter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    const { gmailFn, mockSend } = getGmailMocks();
    gmailFn.mockClear();
    mockSend.mockClear();
  });

  afterEach(() => jest.restoreAllMocks());

  it('sends an email via gmail.users.messages.send', async () => {
    const { mockSend } = getGmailMocks();
    const adapter = new GmailEmailAdapter(makeTokenVault() as any, moduleOptions as any);
    await adapter.send({ to: ['recipient@test.com'], subject: 'Hello', html: '<p>Hello</p>' });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('obtains an access token from TokenVaultFacade', async () => {
    const tokenVault = makeTokenVault();
    const adapter = new GmailEmailAdapter(tokenVault as any, moduleOptions as any);
    await adapter.send({ to: ['r@test.com'], subject: 'S', html: '<p></p>' });
    expect(tokenVault.getAccessToken).toHaveBeenCalledTimes(1);
  });

  it('passes raw base64 message in requestBody', async () => {
    const { mockSend } = getGmailMocks();
    const adapter = new GmailEmailAdapter(makeTokenVault() as any, moduleOptions as any);
    await adapter.send({ to: ['r@test.com'], subject: 'S', html: '<p>Hi</p>' });
    const [{ requestBody }] = mockSend.mock.calls[0];
    expect(requestBody).toHaveProperty('raw');
    expect(typeof requestBody.raw).toBe('string');
  });

  it('includes Cc header in raw message when cc provided', async () => {
    const { mockSend } = getGmailMocks();
    const adapter = new GmailEmailAdapter(makeTokenVault() as any, moduleOptions as any);
    await adapter.send({
      to: ['to@test.com'],
      cc: ['cc@test.com'],
      subject: 'S',
      html: '<p></p>',
    });
    const [{ requestBody }] = mockSend.mock.calls[0];
    const decoded = Buffer.from(requestBody.raw, 'base64url').toString();
    expect(decoded).toContain('Cc: cc@test.com');
  });

  it('includes multipart/alternative content when text is provided', async () => {
    const { mockSend } = getGmailMocks();
    const adapter = new GmailEmailAdapter(makeTokenVault() as any, moduleOptions as any);
    await adapter.send({
      to: ['to@test.com'],
      subject: 'S',
      html: '<p>Hi</p>',
      text: 'Hi',
    });
    const [{ requestBody }] = mockSend.mock.calls[0];
    const decoded = Buffer.from(requestBody.raw, 'base64url').toString();
    expect(decoded).toContain('multipart/alternative');
  });

  it('uses fromAddress from options in the raw message', async () => {
    const { mockSend } = getGmailMocks();
    const adapter = new GmailEmailAdapter(makeTokenVault() as any, moduleOptions as any);
    await adapter.send({ to: ['r@test.com'], subject: 'S', html: '<p></p>' });
    const [{ requestBody }] = mockSend.mock.calls[0];
    const decoded = Buffer.from(requestBody.raw, 'base64url').toString();
    expect(decoded).toContain('noreply@test.com');
  });

  it('calls send with userId="me"', async () => {
    const { mockSend } = getGmailMocks();
    const adapter = new GmailEmailAdapter(makeTokenVault() as any, moduleOptions as any);
    await adapter.send({ to: ['r@test.com'], subject: 'S', html: '<p></p>' });
    const [args] = mockSend.mock.calls[0];
    expect(args.userId).toBe('me');
  });
});
