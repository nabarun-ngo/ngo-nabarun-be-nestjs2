import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, extname, join } from 'path';
import { JsonDocumentSeed, JsonStoreSeedData } from './json-store-seed.types';

export interface LoadJsonStoreSeedOptions {
  /**
   * Default `onConflict` strategy applied to every document loaded from the
   * directory. Can be overridden per namespace via a `_options.json` file
   * placed inside that namespace folder.
   *
   * - `'upsert'` *(default)* — payload is always replaced with the seed file
   *   value on every deploy. Code is the source of truth.
   * - `'skip-if-exists'` — document is inserted on the first deploy and never
   *   touched again. API/manual edits are preserved.
   */
  onConflict?: 'upsert' | 'skip-if-exists';
}

interface NamespaceOptions {
  onConflict?: 'upsert' | 'skip-if-exists';
}

/**
 * Builds a {@link JsonStoreSeedData} object by scanning a directory tree.
 *
 * **Folder layout:**
 * ```
 * <dir>/
 *   <namespace>/
 *     _options.json       ← optional per-namespace config (see below)
 *     <key>.json          ← file content becomes the payload
 * ```
 *
 * **Controlling `onConflict`** — two levels of override, from lowest to
 * highest priority:
 *
 * 1. `options.onConflict` — global default for the entire directory.
 *    Default: `'upsert'`.
 * 2. `_options.json` inside a namespace folder — overrides the global
 *    default for all documents in that namespace.
 *
 * ```
 * seeds/json-store/
 *   correspondence/
 *     welcome-email.json          ← inherits global / options.onConflict
 *   config/
 *     _options.json               ← { "onConflict": "skip-if-exists" }
 *     feature-flags.json          ← skip-if-exists (from _options.json)
 *     rate-limits.json            ← skip-if-exists (from _options.json)
 * ```
 *
 * Files whose names start with `_` (e.g. `_options.json`) are treated as
 * metadata and are never loaded as documents.
 *
 * **Typical usage in `prisma/seed.ts`:**
 * ```ts
 * import { join } from 'path';
 * import { PrismaClient } from '@prisma/client';
 * import { loadJsonStoreSeedFromDir, seedJsonStore } from '@ce/nestjs-shared-json-store';
 *
 * const prisma = new PrismaClient();
 * const data = loadJsonStoreSeedFromDir(join(__dirname, 'seeds/json-store'));
 * await seedJsonStore(prisma, data);
 * await prisma.$disconnect();
 * ```
 */
export function loadJsonStoreSeedFromDir(
  dir: string,
  options?: LoadJsonStoreSeedOptions,
): JsonStoreSeedData {
  const globalConflict = options?.onConflict ?? 'upsert';
  const documents: JsonDocumentSeed[] = [];

  console.log(`[json-store-loader] Scanning directory: ${dir}`);

  let namespaceCount = 0;
  for (const entry of readdirSync(dir)) {
    const entryPath = join(dir, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    namespaceCount++;
    const namespace = entry;
    const files = readdirSync(entryPath);

    // Per-namespace override from _options.json (if present)
    let namespaceConflict = globalConflict;
    if (files.includes('_options.json')) {
      const raw = JSON.parse(
        readFileSync(join(entryPath, '_options.json'), 'utf-8'),
      ) as NamespaceOptions;
      if (raw.onConflict === 'upsert' || raw.onConflict === 'skip-if-exists') {
        namespaceConflict = raw.onConflict;
      }
      console.log(
        `[json-store-loader]   namespace "${namespace}": _options.json found — onConflict="${namespaceConflict}"`,
      );
    } else {
      console.log(
        `[json-store-loader]   namespace "${namespace}" (onConflict: ${namespaceConflict})`,
      );
    }

    for (const file of files) {
      if (extname(file) !== '.json') continue;
      if (file.startsWith('_')) continue; // skip _options.json and any other metadata files

      const key = basename(file, '.json');
      const payload = JSON.parse(
        readFileSync(join(entryPath, file), 'utf-8'),
      ) as Record<string, unknown>;

      console.log(`[json-store-loader]     + ${key} (onConflict: ${namespaceConflict})`);
      documents.push({ namespace, key, payload, onConflict: namespaceConflict });
    }
  }

  console.log(
    `[json-store-loader] Loaded ${documents.length} document(s) across ${namespaceCount} namespace(s).`,
  );

  return { documents };
}
