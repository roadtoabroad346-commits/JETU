/** Retention rehearsal for the guarded disposable local stack; never a hosted selector. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { localCommand } from './db-safety.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
localCommand(
  ['migrations'],
  process.env,
  readFileSync(resolve(root, 'supabase/config.toml'), 'utf8'),
  existsSync(resolve(root, 'supabase/.temp/project-ref')),
);
const config = JSON.parse(
  execFileSync(
    resolve(root, 'node_modules/.bin/supabase'),
    ['status', '-o', 'json', '--workdir', root],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ),
);
assert.equal(config.API_URL, 'http://127.0.0.1:54321');
const client = createClient(
  config.API_URL,
  config.SECRET_KEY || config.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const candidates = await client.rpc('mentor_retention_candidates');
assert.equal(candidates.error, null);
let count = 0;
for (const item of candidates.data) {
  const removed = await client.storage
    .from('mentor-evidence')
    .remove([item.path]);
  assert.equal(removed.error, null);
  const result = await client.rpc('mentor_retention_finish', { p_id: item.id });
  assert.equal(result.error, null);
  count++;
}
console.log(
  `Local evidence retention: ${count} expired items removed; no paths or personal content logged.`,
);
