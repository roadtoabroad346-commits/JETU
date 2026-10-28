// Explicit development target; credentials come from the execution environment.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const target = 'https://edpuovkgoisyzpguksdi.supabase.co';
const required = [
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'JETU_QA_A_EMAIL',
  'JETU_QA_A_PASSWORD',
  'JETU_QA_B_EMAIL',
  'JETU_QA_B_PASSWORD',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
const clients = ['A', 'B'].map(() =>
  createClient(target, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
try {
  const ids = [];
  for (const [index, name] of ['A', 'B'].entries()) {
    const result = await clients[index].auth.signInWithPassword({
      email: process.env[`JETU_QA_${name}_EMAIL`],
      password: process.env[`JETU_QA_${name}_PASSWORD`],
    });
    assert.equal(result.error, null, `QA ${name} login failed`);
    const identity = await clients[index].auth.getUser();
    assert.equal(identity.error, null, `QA ${name} identity failed`);
    assert.ok(identity.data.user?.email_confirmed_at);
    ids.push(identity.data.user.id);
  }
  assert.notEqual(ids[0], ids[1], 'Two distinct identities required');
  for (let index = 0; index < clients.length; index++) {
    for (const table of ['student_profiles', 'roadmaps', 'roadmap_tasks']) {
      const result = await clients[index]
        .from(table)
        .select('user_id')
        .eq('user_id', ids[1 - index]);
      assert.equal(result.error, null, `${table} query failed`);
      assert.deepEqual(result.data, [], `${table} cross-user visibility`);
    }
  }
  console.log('PASS: two confirmed hosted logins; cross-user reads denied.');
  console.log(
    'Read-only smoke; populated write/browser acceptance remains separate.',
  );
} catch {
  console.error(
    'FAIL: hosted Auth/RLS smoke. No credentials or provider details logged.',
  );
  process.exitCode = 1;
} finally {
  await Promise.allSettled(
    clients.map((client) => client.auth.signOut({ scope: 'local' })),
  );
}
