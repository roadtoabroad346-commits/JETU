/** Disposable local Supabase only. Real GoTrue sessions and Storage HTTP, no hosted keys. */
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';
import { localCommand } from './db-safety.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
localCommand(
  ['migrations'],
  process.env,
  readFileSync(resolve(root, 'supabase/config.toml'), 'utf8'),
  existsSync(resolve(root, 'supabase/.temp/project-ref')),
);
const cli = resolve(root, 'node_modules/.bin/supabase');
const config = JSON.parse(
  execFileSync(cli, ['status', '-o', 'json', '--workdir', root], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
assert.equal(
  config.API_URL,
  'http://127.0.0.1:54321',
  'Only the guarded local gateway is allowed',
);
const publicKey = config.PUBLISHABLE_KEY || config.ANON_KEY;
const admin = createClient(
  config.API_URL,
  config.SECRET_KEY || config.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const clients = [],
  identities = [],
  paths = [];
let browser, server;
let checks = 0;
function ok(condition, message) {
  assert.ok(condition, message);
  checks++;
}
function value(result) {
  assert.equal(result.error, null, 'Local provider operation failed');
  return result.data;
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (let i = 0; i < 3; i++) {
    const email = `phase19-${randomBytes(8).toString('hex')}@example.invalid`,
      password = randomBytes(24).toString('base64url');
    const data = value(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: i === 1 ? { role: 'mentor' } : {},
      }),
    );
    identities.push({ id: data.user.id, email, password });
    const client = createClient(config.API_URL, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    value(await client.auth.signInWithPassword({ email, password }));
    clients.push(client);
  }
  const [a, b] = clients,
    text = 'Synthetic private essay. Әлем hello.',
    bytes = new TextEncoder().encode(text),
    hash = createHash('sha256').update(bytes).digest('hex'),
    versionId = crypto.randomUUID();
  const version = value(
    await a.rpc('vault_reserve', {
      p_document_id: null,
      p_category: 'essay',
      p_name: 'Synthetic essay.txt',
      p_purpose: '',
      p_application_id: null,
      p_extension: 'txt',
      p_mime: 'text/plain',
      p_size: bytes.length,
      p_sha256: hash,
      p_request_id: versionId,
      p_recommendation_id: null,
    }),
  );
  paths.push(version.object_path);
  value(
    await a.storage.from('student-vault').upload(version.object_path, bytes, {
      contentType: 'text/plain',
      upsert: false,
    }),
  );
  value(
    await a.rpc('vault_finish', { p_version_id: versionId, p_failed: false }),
  );
  ok(
    Boolean(
      (await a.storage.from('student-vault').download(version.object_path))
        .error,
    ),
    'owner cannot download quarantine',
  );
  ok(
    Boolean(
      (await b.storage.from('student-vault').download(version.object_path))
        .error,
    ),
    'B cannot download quarantine',
  );
  ok(
    Boolean(
      (
        await a.rpc('vault_scan_result', {
          p_version_id: versionId,
          p_sha256: hash,
          p_clean: true,
          p_scanner: 'forged',
        })
      ).error,
    ),
    'student cannot forge verdict',
  );
  // Synthetic trusted verdict exercises promotion authorization, not real malware scanning.
  value(
    await admin.rpc('vault_scan_result', {
      p_version_id: versionId,
      p_sha256: hash,
      p_clean: true,
      p_scanner: 'synthetic integration verdict; no malware claim',
    }),
  );
  const downloaded = value(
    await a.storage.from('student-vault').download(version.object_path),
  );
  ok(
    (await downloaded.text()) === text,
    'owner retrieves exact immutable bytes',
  );
  ok(
    Boolean(
      (await b.storage.from('student-vault').download(version.object_path))
        .error,
    ),
    'mentor role without grant cannot retrieve A blob',
  );
  ok(
    value(
      await b
        .from('vault_documents')
        .select('id')
        .eq('id', version.document_id),
    ).length === 0,
    'B metadata isolation',
  );
  ok(
    value(await b.from('vault_versions').select('id').eq('id', versionId))
      .length === 0,
    'B version isolation',
  );
  ok(
    Boolean(
      (
        await b.storage
          .from('student-vault')
          .createSignedUrl(version.object_path, 30)
      ).error,
    ),
    'B cannot sign A path',
  );
  ok(
    Boolean(
      (
        await a.storage
          .from('student-vault')
          .createSignedUrl(version.object_path, 3600)
      ).error,
    ),
    'even owner reusable signing denied',
  );
  const anonymous = createClient(config.API_URL, publicKey, {
    auth: { persistSession: false },
  });
  ok(
    Boolean((await anonymous.storage.from('student-vault').list()).error) ||
      value(await anonymous.storage.from('student-vault').list()).length === 0,
    'anonymous listing denied',
  );
  const publicResponse = await fetch(
    `${config.API_URL}/storage/v1/object/public/student-vault/${version.object_path}`,
  );
  ok(!publicResponse.ok, 'public object URL denied');
  const draftId = crypto.randomUUID(),
    requestId = crypto.randomUUID(),
    writing = {
      p_id: draftId,
      p_expected_version: 0,
      p_title: 'Private essay',
      p_kind: 'essay',
      p_content: 'My own words. Әлем.',
      p_prompt: 'User-entered prompt',
      p_word_limit: 100,
      p_rubric: { clarity: true },
      p_application_id: null,
      p_request_id: requestId,
    };
  value(await a.rpc('writing_save', writing));
  ok(
    value(await b.from('writing_drafts').select('id').eq('id', draftId))
      .length === 0,
    'B cannot read A draft',
  );
  ok(
    Boolean(
      (
        await b.rpc('writing_save', {
          ...writing,
          p_expected_version: 1,
          p_request_id: crypto.randomUUID(),
        })
      ).error,
    ),
    'B cannot alter A draft',
  );
  ok(
    Boolean(
      (
        await a.rpc('writing_save', {
          ...writing,
          p_expected_version: 0,
          p_request_id: crypto.randomUUID(),
        })
      ).error,
    ),
    'stale real Auth save conflicts',
  );
  const concurrent = await Promise.all(
    [2, 3].map((n) =>
      a.rpc('writing_save', {
        ...writing,
        p_expected_version: 1,
        p_content: `Concurrent revision ${n}`,
        p_request_id: crypto.randomUUID(),
      }),
    ),
  );
  ok(
    concurrent.filter((r) => !r.error).length === 1,
    'parallel authenticated writes preserve one revision',
  );
  console.log(
    JSON.stringify({
      stage: 'real-auth-storage-rpc',
      checks,
      status: 'passed',
      environment: 'disposable local',
    }),
  );
  // Actual browser -> Next -> GoTrue/REST -> persisted writing, with no fixture API routes.
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: config.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3300',
    SUPABASE_SECRET_KEY: config.SECRET_KEY,
  };
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 240000,
  });
  assert.equal(build.status, 0, 'Configured production build failed');
  server = spawn('npm', ['run', 'start', '--', '--port', '3300'], {
    cwd: root,
    env,
    stdio: 'ignore',
    detached: true,
  });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      ready = (await fetch('http://127.0.0.1:3300/api/health')).ok;
      if (ready) break;
    } catch {
      /* Local server is still starting or has already stopped. */
    }
    await pause(500);
  }
  assert.ok(ready, 'Configured app did not start');
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  const ca = await browser.newContext(),
    cb = await browser.newContext();
  async function login(context, identity) {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3300/en/login');
    await page
      .getByRole('textbox', { name: 'Email address', exact: true })
      .fill(identity.email);
    await page.getByLabel(/^Password/).fill(identity.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**/en/dashboard');
    return page;
  }
  const pa = await login(ca, identities[0]),
    pb = await login(cb, identities[1]);
  // Phase 17: actual local Auth -> Next -> trusted generation, no published catalog fixtures.
  const roadmapHeaders = { origin: 'http://127.0.0.1:3300' };
  const generatedResponse = await ca.request.post(
    'http://127.0.0.1:3300/api/roadmaps',
    {
      headers: roadmapHeaders,
      data: {
        locale: 'en',
        cycleYear: 2027,
        timezone: 'Asia/Almaty',
        availabilityMinutesPerWeek: 300,
        targetIds: [],
      },
    },
  );
  ok(
    generatedResponse.ok(),
    'trusted Next generation succeeds with real local Auth',
  );
  const roadmapState = (
    await (await ca.request.get('http://127.0.0.1:3300/api/roadmaps')).json()
  ).data;
  const generatedTask = roadmapState.tasks.find(
    (t) => t.origin === 'generated',
  );
  assert.ok(generatedTask, 'missing-profile roadmap creates actual tasks');
  ok(
    Boolean(
      (
        await a.rpc('roadmap_apply_generation', {
          p_user_id: identities[0].id,
          p_cycle_year: 2027,
          p_timezone_name: 'Asia/Almaty',
          p_availability_minutes_per_week: 300,
          p_generation_version: 'roadmap-v1',
          p_input_hash: 'a'.repeat(64),
          p_profile_version: null,
          p_targets: [],
          p_milestones: [],
          p_tasks: [],
          p_dependencies: [],
        })
      ).error,
    ),
    'real authenticated transport cannot invoke trusted generation directly',
  );
  ok(
    Boolean(
      (
        await a
          .from('roadmap_tasks')
          .update({
            title: 'Forged generation',
            version: generatedTask.version + 1,
          })
          .eq('id', generatedTask.id)
      ).error,
    ),
    'real owner cannot forge generated text through REST',
  );
  const patched = await ca.request.patch(
    `http://127.0.0.1:3300/api/roadmaps/tasks/${generatedTask.id}`,
    {
      headers: roadmapHeaders,
      data: {
        version: generatedTask.version,
        note: 'Actual local persistence check',
        targetDate: '2027-01-02',
      },
    },
  );
  ok(patched.ok(), 'owner edits remain available through actual Next API');
  const otherRoadmap = (
    await (await cb.request.get('http://127.0.0.1:3300/api/roadmaps')).json()
  ).data;
  ok(
    otherRoadmap.roadmap === null && otherRoadmap.tasks.length === 0,
    'second actual Auth owner cannot read first roadmap',
  );
  ok(
    (
      await cb.request.patch(
        `http://127.0.0.1:3300/api/roadmaps/tasks/${generatedTask.id}`,
        {
          headers: roadmapHeaders,
          data: {
            version: generatedTask.version + 1,
            note: 'Cross-user tamper',
          },
        },
      )
    ).status() === 404,
    'second actual Auth owner cannot modify first roadmap',
  );
  const secondDevice = await browser.newContext();
  const secondPage = await login(secondDevice, identities[0]);
  await secondPage.goto('http://127.0.0.1:3300/en/plan');
  await secondPage.reload();
  const persistedRoadmap = (
    await (
      await secondDevice.request.get('http://127.0.0.1:3300/api/roadmaps')
    ).json()
  ).data;
  ok(
    persistedRoadmap.tasks.some(
      (t) =>
        t.id === generatedTask.id &&
        t.note === 'Actual local persistence check' &&
        t.targetDate === '2027-01-02',
    ),
    'independent browser session and refresh preserve roadmap edits',
  );
  await secondDevice.close();
  await pa.goto('http://127.0.0.1:3300/en/vault');
  await pa.getByRole('button', { name: /Synthetic essay.txt/ }).waitFor();
  checks++;
  const uploadForm = pa
    .locator('form')
    .filter({ has: pa.locator('input[type="file"]') });
  await uploadForm
    .locator('select:has(option[value="essay"])')
    .selectOption('essay');
  await uploadForm.locator('input[type="file"]').setInputFiles({
    name: 'Browser upload.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Browser created essay. Әлем.'),
  });
  const uploaded = pa.waitForResponse(
    (r) =>
      r.url().endsWith('/api/vault/upload') && r.request().method() === 'POST',
  );
  await uploadForm
    .getByRole('button', { name: 'Upload document', exact: true })
    .click();
  const uploadResponse = await uploaded;
  ok(
    uploadResponse.status() === 200 &&
      (await uploadResponse.json()).data.state === 'quarantined',
    'browser upload reaches actual quarantine pipeline',
  );
  const vaultState = (
    await (await ca.request.get('http://127.0.0.1:3300/api/vault')).json()
  ).data;
  const browserDoc = vaultState.documents.find(
    (d) => d.display_name === 'Browser upload.txt',
  );
  assert.ok(browserDoc, 'Browser upload metadata persists');
  const browserVersion = vaultState.versions.find(
    (v) => v.id === browserDoc.current_version_id,
  );
  paths.push(browserVersion.object_path);
  ok(
    (
      await ca.request.get(
        `http://127.0.0.1:3300/api/vault/file?version=${browserVersion.id}`,
      )
    ).status() === 403,
    'quarantine denied through actual Next API',
  );
  ok(
    (
      await cb.request.get(
        `http://127.0.0.1:3300/api/vault/file?version=${browserVersion.id}`,
      )
    ).status() === 404,
    'B cannot retrieve browser upload',
  );
  const requestHeaders = {
    origin: 'http://127.0.0.1:3300',
    'content-type': 'application/pdf',
    'x-vault-metadata': encodeURIComponent(
      JSON.stringify({
        category: 'essay',
        name: 'Mismatch.pdf',
        requestId: crypto.randomUUID(),
      }),
    ),
  };
  ok(
    (
      await ca.request.post('http://127.0.0.1:3300/api/vault/upload', {
        headers: requestHeaders,
        data: Buffer.from('not a PDF'),
      })
    ).status() === 422,
    'authenticated MIME/signature mismatch fails',
  );
  ok(
    (
      await ca.request.post('http://127.0.0.1:3300/api/vault/upload', {
        headers: {
          ...requestHeaders,
          'content-type': 'text/plain',
          'x-vault-metadata': encodeURIComponent(
            JSON.stringify({
              category: 'essay',
              name: 'Oversized.txt',
              requestId: crypto.randomUUID(),
            }),
          ),
        },
        data: Buffer.alloc(3145729, 65),
      })
    ).status() === 422,
    'authenticated oversized request fails',
  );
  await pb.goto('http://127.0.0.1:3300/en/vault');
  await pb
    .getByText('No documents yet. Add only what your next application needs.')
    .waitFor();
  checks++;
  const forbidden = await cb.request.get(
    `http://127.0.0.1:3300/api/vault/file?version=${versionId}`,
  );
  ok(forbidden.status() === 404, 'B cannot request A file through Next proxy');
  const allowed = await ca.request.get(
    `http://127.0.0.1:3300/api/vault/file?version=${versionId}`,
  );
  ok(
    allowed.status() === 200 && (await allowed.text()) === text,
    'authenticated Next download works',
  );
  ok(
    allowed.headers()['cache-control'].includes('no-store'),
    'private download uncacheable',
  );
  await pa.goto('http://127.0.0.1:3300/en/writing');
  await pa.getByRole('button', { name: 'New draft', exact: true }).click();
  await pa.getByLabel('Title', { exact: true }).fill('Browser persisted essay');
  await pa
    .getByRole('textbox', { name: 'Your draft', exact: true })
    .fill('Browser authorship. Әлем hello.');
  await pa.getByRole('button', { name: 'Save revision', exact: true }).click();
  await pa.getByRole('status').filter({ hasText: 'Saved' }).waitFor();
  checks++;
  await pa.reload();
  await pa.getByRole('button', { name: /Browser persisted essay/ }).click();
  ok(
    (await pa
      .getByRole('textbox', { name: 'Your draft', exact: true })
      .inputValue()) === 'Browser authorship. Әлем hello.',
    'writing survives browser refresh',
  );
  value(
    await a.rpc('vault_manage', {
      p_document_id: version.document_id,
      p_action: 'archive',
    }),
  );
  ok(
    (
      await ca.request.get(
        `http://127.0.0.1:3300/api/vault/file?version=${versionId}`,
      )
    ).status() === 403,
    'archive revokes new owner requests',
  );
  ok(
    Boolean(
      (
        await b.storage
          .from('student-vault')
          .createSignedUrl(version.object_path, 30)
      ).error,
    ),
    'mentor remains denied after archive',
  );
  console.log(
    JSON.stringify({
      checks,
      status: 'passed',
      environment: 'disposable local GoTrue/Storage/browser',
      browserVersion: browser.version(),
      malwareScan: 'synthetic verdict only',
    }),
  );
} finally {
  await browser?.close();
  if (server?.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      /* Local server is still starting or has already stopped. */
    }
  }
  if (identities.length) {
    const rows = value(
      await admin
        .from('vault_versions')
        .select('object_path')
        .in(
          'user_id',
          identities.map((i) => i.id),
        ),
    );
    paths.push(...rows.map((r) => r.object_path));
  }
  if (paths.length)
    value(
      await admin.storage.from('student-vault').remove([...new Set(paths)]),
    );
  for (const identity of identities)
    value(await admin.auth.admin.deleteUser(identity.id));
}
