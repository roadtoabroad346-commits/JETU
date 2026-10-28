/** Run only in a trusted private worker with ClamAV and SUPABASE_SECRET_KEY.
 * No public webhook or client-supplied verdict. Does not install or fake a scanner.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  scannerDatabaseFresh,
  validateFile,
} from '../src/features/vault/files.ts';

const run = promisify(execFile);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  secret = process.env.SUPABASE_SECRET_KEY;
if (!url?.startsWith('https://') || !secret?.startsWith('sb_secret_'))
  throw new Error('Trusted worker credentials not configured');
const client = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
function check(result) {
  if (result.error) throw new Error('Worker provider operation failed');
  return result.data;
}
let processed = 0;
if (!process.argv.includes('--purge-only')) {
  // Require a working scanner even if there are no pending objects.
  const version = await run('clamscan', ['--version'], {
    timeout: 10000,
    maxBuffer: 1024,
  });
  if (!scannerDatabaseFresh(version.stdout.trim(), Date.now()))
    throw new Error(
      'Scanner definitions absent, stale or invalid; quarantine retained',
    );
  const scanner = version.stdout.trim().slice(0, 120);
  if (!scanner.startsWith('ClamAV ')) throw new Error('Unsupported scanner');
  const now = new Date().toISOString();
  const pending = check(
    await client
      .from('vault_versions')
      .select(
        '*,vault_documents!vault_versions_document_id_user_id_fkey!inner(category,deleted_at,expires_at)',
      )
      .eq('state', 'quarantined')
      .is('vault_documents.deleted_at', null)
      .gt('vault_documents.expires_at', now)
      .lte('next_scan_at', now)
      .order('created_at')
      .limit(20),
  );

  for (const v of pending) {
    const directory = await mkdtemp(join(tmpdir(), 'jetu-scan-'));
    try {
      const blob = check(
        await client.storage.from('student-vault').download(v.object_path),
      );
      if (blob.size !== v.byte_size || blob.size > 3145728)
        throw new Error('Object integrity failure');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const hash = createHash('sha256').update(bytes).digest('hex');
      let clean = hash === v.sha256;
      if (clean) {
        try {
          validateFile(
            bytes,
            `asset.${v.extension}`,
            v.mime,
            v.vault_documents.category,
          );
        } catch {
          clean = false;
        }
      }
      if (clean) {
        const path = join(directory, `asset.${v.extension}`);
        await writeFile(path, bytes, { mode: 0o600 });
        try {
          await run(
            'clamscan',
            [
              '--no-summary',
              '--infected',
              '--alert-exceeds-max=yes',
              '--alert-encrypted=yes',
              '--max-filesize=3M',
              '--max-scansize=12M',
              '--max-recursion=8',
              '--max-files=100',
              path,
            ],
            {
              timeout: 60000,
              maxBuffer: 8192,
            },
          );
        } catch (error) {
          if (error.code === 1) clean = false;
          else
            throw new Error('Scanner unavailable; quarantine retained', {
              cause: error,
            });
        }
      }
      check(
        await client.rpc('vault_scan_result', {
          p_version_id: v.id,
          p_sha256: v.sha256,
          p_clean: clean,
          p_scanner: scanner,
        }),
      );
      processed++;
    } catch {
      // Provider/scanner failures retain quarantine and retry with bounded backoff.
      const attempts = v.scan_attempts + 1;
      check(
        await client
          .from('vault_versions')
          .update({
            scan_attempts: attempts,
            next_scan_at: new Date(
              Date.now() +
                Math.min(21600000, 300000 * 2 ** Math.min(attempts, 10)),
            ).toISOString(),
          })
          .eq('id', v.id)
          .eq('state', 'quarantined'),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
const now = new Date().toISOString();
// Mark expired documents inaccessible before physical removal. Storage backups have
// a distinct lifecycle; this worker never claims to erase retained provider backups.
check(
  await client
    .from('vault_documents')
    .update({ deleted_at: now })
    .is('deleted_at', null)
    .lt('expires_at', now),
);
const expired = check(
  await client
    .from('vault_documents')
    .select('id,user_id')
    .not('deleted_at', 'is', null)
    .is('purged_at', null)
    .limit(100),
);
for (const d of expired) {
  const versions = check(
    await client
      .from('vault_versions')
      .select('object_path')
      .eq('document_id', d.id),
  );
  if (versions.length)
    check(
      await client.storage
        .from('student-vault')
        .remove(versions.map((v) => v.object_path)),
    );
  check(
    await client
      .from('vault_documents')
      .update({ purged_at: now })
      .eq('id', d.id),
  );
  check(
    await client
      .from('vault_events')
      .insert({ document_id: d.id, user_id: d.user_id, event_type: 'purged' }),
  );
}
// Incomplete uploads never become readable. Their objects are reconciled after 1h.
const abandoned = check(
  await client
    .from('vault_versions')
    .select('id,object_path')
    .in('state', ['uploading', 'failed'])
    .lt('created_at', new Date(Date.now() - 3600000).toISOString())
    .limit(100),
);
for (const v of abandoned) {
  check(
    await client
      .from('vault_versions')
      .update({ state: 'failed' })
      .eq('id', v.id)
      .eq('state', 'uploading'),
  );
  check(await client.storage.from('student-vault').remove([v.object_path]));
}
check(
  await client
    .from('writing_drafts')
    .delete()
    .lt('updated_at', new Date(Date.now() - 365 * 86400000).toISOString()),
);
console.log(
  JSON.stringify({
    processed,
    purged: expired.length,
    abandoned: abandoned.length,
  }),
);
