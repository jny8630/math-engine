import { describe, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_NUMERIC_TEMPLATES } from '../src/problems/generators/registry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = join(__dirname, 'snapshots');

// Strip non-deterministic IDs so snapshot files are diff-friendly.
function strip<T extends { id: string }>(p: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = p;
  return rest;
}

describe('snapshot generation', () => {
  it('writes 100 samples per template (50 tidy + 50 loose) to tests/snapshots/', () => {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    for (const template of ALL_NUMERIC_TEMPLATES) {
      const tidy = Array.from({ length: 50 }, () => strip(template.generate(true)));
      const loose = Array.from({ length: 50 }, () => strip(template.generate(false)));
      const payload = {
        templateId: template.id,
        tags: template.tags,
        tidyMode: tidy,
        looseMode: loose,
      };
      writeFileSync(join(SNAPSHOT_DIR, `${template.id}.json`), JSON.stringify(payload, null, 2));
    }
  });
});
