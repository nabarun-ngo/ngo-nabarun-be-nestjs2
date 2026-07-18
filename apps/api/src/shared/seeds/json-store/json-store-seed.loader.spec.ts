import 'reflect-metadata';
import { loadJsonStoreSeedFromDir } from './json-store-seed.loader';

jest.mock('fs');

import { readdirSync, readFileSync, statSync } from 'fs';

const mockReaddirSync = readdirSync as jest.Mock;
const mockReadFileSync = readFileSync as jest.Mock;
const mockStatSync = statSync as jest.Mock;

function dirStat() {
  return { isDirectory: () => true } as ReturnType<typeof statSync>;
}

function fileStat() {
  return { isDirectory: () => false } as ReturnType<typeof statSync>;
}

describe('loadJsonStoreSeedFromDir', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────────────────────────────────
  // Basic loading
  // ─────────────────────────────────────────────────────────────────────────

  it('maps namespace folders and .json files to documents', () => {
    mockReaddirSync.mockImplementation((p: string) => {
      if (p === '/seeds') return ['correspondence', 'cron'];
      if (p.endsWith('correspondence')) return ['welcome-email.json', 'reset-password.json'];
      if (p.endsWith('cron')) return ['daily-report.json'];
      return [];
    });
    mockStatSync.mockImplementation((p: string) =>
      p.endsWith('.json') ? fileStat() : dirStat(),
    );
    mockReadFileSync.mockImplementation((p: string) => {
      if (p.endsWith('welcome-email.json')) return JSON.stringify({ subject: 'Welcome!' });
      if (p.endsWith('reset-password.json')) return JSON.stringify({ subject: 'Reset password' });
      if (p.endsWith('daily-report.json')) return JSON.stringify({ schedule: '0 6 * * *' });
      return '{}';
    });

    const result = loadJsonStoreSeedFromDir('/seeds');

    expect(result.documents).toHaveLength(3);
    expect(result.documents).toEqual(
      expect.arrayContaining([
        {
          namespace: 'correspondence',
          key: 'welcome-email',
          payload: { subject: 'Welcome!' },
          onConflict: 'upsert',
        },
        {
          namespace: 'cron',
          key: 'daily-report',
          payload: { schedule: '0 6 * * *' },
          onConflict: 'upsert',
        },
      ]),
    );
  });

  it('skips non-directory entries at the root level', () => {
    mockReaddirSync.mockImplementation((p: string) => {
      if (p === '/seeds') return ['README.md', 'correspondence'];
      if (p.endsWith('correspondence')) return ['welcome-email.json'];
      return [];
    });
    mockStatSync.mockImplementation((p: string) => {
      if (p.endsWith('README.md')) return fileStat();
      return p.endsWith('.json') ? fileStat() : dirStat();
    });
    mockReadFileSync.mockReturnValue(JSON.stringify({ subject: 'Hi' }));

    const result = loadJsonStoreSeedFromDir('/seeds');

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].namespace).toBe('correspondence');
  });

  it('skips non-.json files inside namespace folders', () => {
    mockReaddirSync.mockImplementation((p: string) => {
      if (p === '/seeds') return ['my-ns'];
      if (p.endsWith('my-ns')) return ['data.json', 'notes.txt', 'schema.ts'];
      return [];
    });
    mockStatSync.mockImplementation((p: string) =>
      p.endsWith('.json') || p.includes('.') ? fileStat() : dirStat(),
    );
    mockReadFileSync.mockReturnValue(JSON.stringify({ value: 1 }));

    const result = loadJsonStoreSeedFromDir('/seeds');

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].key).toBe('data');
  });

  it('returns empty documents when the directory is empty', () => {
    mockReaddirSync.mockReturnValue([]);
    const result = loadJsonStoreSeedFromDir('/seeds');
    expect(result.documents).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Global onConflict option
  // ─────────────────────────────────────────────────────────────────────────

  describe('global onConflict option', () => {
    beforeEach(() => {
      mockReaddirSync.mockImplementation((p: string) => {
        if (p === '/seeds') return ['ns'];
        if (p.endsWith('ns')) return ['doc.json'];
        return [];
      });
      mockStatSync.mockImplementation((p: string) =>
        p.endsWith('.json') ? fileStat() : dirStat(),
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({ value: 1 }));
    });

    it('defaults to upsert when no option is given', () => {
      const result = loadJsonStoreSeedFromDir('/seeds');
      expect(result.documents[0].onConflict).toBe('upsert');
    });

    it('applies upsert globally when option is upsert', () => {
      const result = loadJsonStoreSeedFromDir('/seeds', { onConflict: 'upsert' });
      expect(result.documents[0].onConflict).toBe('upsert');
    });

    it('applies skip-if-exists globally when option is skip-if-exists', () => {
      const result = loadJsonStoreSeedFromDir('/seeds', { onConflict: 'skip-if-exists' });
      expect(result.documents[0].onConflict).toBe('skip-if-exists');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Per-namespace _options.json
  // ─────────────────────────────────────────────────────────────────────────

  describe('per-namespace _options.json', () => {
    it('uses onConflict from _options.json for that namespace', () => {
      mockReaddirSync.mockImplementation((p: string) => {
        if (p === '/seeds') return ['config'];
        if (p.endsWith('config')) return ['_options.json', 'feature-flags.json'];
        return [];
      });
      mockStatSync.mockImplementation((p: string) =>
        p.endsWith('.json') ? fileStat() : dirStat(),
      );
      mockReadFileSync.mockImplementation((p: string) => {
        if (p.endsWith('_options.json')) return JSON.stringify({ onConflict: 'skip-if-exists' });
        return JSON.stringify({ newDashboard: false });
      });

      const result = loadJsonStoreSeedFromDir('/seeds');

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).toEqual({
        namespace: 'config',
        key: 'feature-flags',
        payload: { newDashboard: false },
        onConflict: 'skip-if-exists',
      });
    });

    it('_options.json overrides the global option for its namespace only', () => {
      mockReaddirSync.mockImplementation((p: string) => {
        if (p === '/seeds') return ['templates', 'config'];
        if (p.endsWith('templates')) return ['welcome.json'];
        if (p.endsWith('config')) return ['_options.json', 'flags.json'];
        return [];
      });
      mockStatSync.mockImplementation((p: string) =>
        p.endsWith('.json') ? fileStat() : dirStat(),
      );
      mockReadFileSync.mockImplementation((p: string) => {
        if (p.endsWith('_options.json')) return JSON.stringify({ onConflict: 'skip-if-exists' });
        return JSON.stringify({ x: 1 });
      });

      // global is 'upsert', but config namespace overrides to 'skip-if-exists'
      const result = loadJsonStoreSeedFromDir('/seeds', { onConflict: 'upsert' });

      const templateDoc = result.documents.find((d) => d.namespace === 'templates');
      const configDoc = result.documents.find((d) => d.namespace === 'config');

      expect(templateDoc?.onConflict).toBe('upsert');
      expect(configDoc?.onConflict).toBe('skip-if-exists');
    });

    it('skips _options.json as a document — does not add it to the output', () => {
      mockReaddirSync.mockImplementation((p: string) => {
        if (p === '/seeds') return ['ns'];
        if (p.endsWith('ns')) return ['_options.json', 'data.json'];
        return [];
      });
      mockStatSync.mockImplementation((p: string) =>
        p.endsWith('.json') ? fileStat() : dirStat(),
      );
      mockReadFileSync.mockImplementation((p: string) => {
        if (p.endsWith('_options.json')) return JSON.stringify({ onConflict: 'upsert' });
        return JSON.stringify({ v: 1 });
      });

      const result = loadJsonStoreSeedFromDir('/seeds');

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].key).toBe('data');
    });

    it('ignores unknown keys in _options.json gracefully', () => {
      mockReaddirSync.mockImplementation((p: string) => {
        if (p === '/seeds') return ['ns'];
        if (p.endsWith('ns')) return ['_options.json', 'doc.json'];
        return [];
      });
      mockStatSync.mockImplementation((p: string) =>
        p.endsWith('.json') ? fileStat() : dirStat(),
      );
      mockReadFileSync.mockImplementation((p: string) => {
        if (p.endsWith('_options.json')) return JSON.stringify({ unknownField: 'whatever' });
        return JSON.stringify({ v: 1 });
      });

      const result = loadJsonStoreSeedFromDir('/seeds');

      // falls back to global default
      expect(result.documents[0].onConflict).toBe('upsert');
    });
  });
});
