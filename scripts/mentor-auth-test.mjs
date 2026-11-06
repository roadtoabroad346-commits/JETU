/** Real disposable GoTrue/REST/Storage + Next/browser test. No hosted credentials. */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium } from '@playwright/test';
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
const publicKey = config.PUBLISHABLE_KEY || config.ANON_KEY;
const serviceKey = config.SECRET_KEY || config.SERVICE_ROLE_KEY;
const admin = createClient(config.API_URL, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const identities = [],
  clients = [],
  paths = [],
  evidencePaths = [];
let browser,
  server,
  checks = 0;
function data(result) {
  assert.equal(
    result.error,
    null,
    `Local operation failed: ${result.error?.code ?? result.error?.name ?? ''}`,
  );
  return result.data;
}
function check(condition, message) {
  assert.ok(condition, message);
  checks++;
  console.log(`PASS ${checks}: ${message}`);
}
function sql(statement) {
  return execFileSync(
    'docker',
    [
      '--host=unix:///var/run/docker.sock',
      'exec',
      '-i',
      'supabase_db_jetu-local',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
    ],
    { input: statement, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );
}
async function command(actor, value) {
  return data(await actor.rpc('mentor_command', { p_input: value }));
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  for (let n = 0; n < 7; n++) {
    const email = `phase22-${randomBytes(8).toString('hex')}@example.invalid`,
      password = randomBytes(24).toString('base64url');
    const created = data(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: n === 2 ? 'mentor' : 'student' },
      }),
    );
    identities.push({ id: created.user.id, email, password });
    const client = createClient(config.API_URL, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    data(await client.auth.signInWithPassword({ email, password }));
    clients.push(client);
  }
  const [a, b, x, y, z, verifier, moderator] = clients;
  const [A, B, X, Y, Z, V, M] = identities.map((i) => i.id);
  for (const [client, name] of [
    [x, 'X'],
    [y, 'Y'],
    [z, 'Z'],
  ]) {
    await command(client, {
      op: 'apply',
      name: `SYNTHETIC CI Mentor ${name}`,
      bio: 'Isolated disposable testing fixture only',
      expertise: ['essay'],
      languages: ['en'],
      countries: ['KZ'],
      degrees: ['bachelor'],
      timezone: 'Asia/Almaty',
      capacity: 20,
      terms: true,
    });
    await command(client, {
      op: 'service',
      kind: 'essay',
      summary: 'Synthetic essay feedback service',
      deliverables: 'Comments, rubric and review summary',
      hours: 72,
      price: 0,
      currency: 'KZT',
    });
  }
  // Staff is seeded ONLY by the isolated database fixture, never through a browser role.
  sql(
    `insert into jetu_private.mentor_staff(user_id,role) values('${V}','verifier'),('${M}','moderator');`,
  );
  for (const [client, id] of [
    [x, X],
    [y, Y],
  ]) {
    const bytes = new TextEncoder().encode(
      '%PDF-1.4\nSYNTHETIC verification evidence; no identity claim\n',
    );
    const evidence = await command(client, {
      op: 'evidence_reserve',
      claim: 'SYNTHETIC fixture evidence for CI only',
      mime: 'application/pdf',
      size: bytes.length,
    });
    evidencePaths.push(evidence.path);
    data(
      await client.storage
        .from('mentor-evidence')
        .upload(evidence.path, bytes, { contentType: 'application/pdf' }),
    );
    await command(client, { op: 'evidence_submit', id: evidence.id });
    check(
      Boolean(
        (
          await client.rpc('mentor_command', {
            p_input: {
              op: 'verify',
              mentor: id,
              state: 'verified',
              revision: 2,
              summary: 'Fabricated self approval must fail',
              reason: 'Synthetic self approval attack',
              attest: true,
            },
          })
        ).error,
      ),
      'applicant cannot self-approve',
    );
    const profile = data(
      await verifier
        .from('mentor_profiles')
        .select('revision')
        .eq('user_id', id)
        .single(),
    );
    await command(verifier, {
      op: 'verify',
      mentor: id,
      revision: profile.revision,
      state: 'verified',
      summary: 'SYNTHETIC fixture proof reviewed for testing',
      reason: 'SYNTHETIC automated fixture, not a human approval',
      attest: true,
    });
  }
  const directory = data(await a.rpc('mentor_directory'));
  const service = directory
    .find((m) => m.id === X)
    .services.find((s) => s.kind === 'essay');
  check(
    directory.some((m) => m.id === X) && !directory.some((m) => m.id === Z),
    'directory excludes unverified applicant',
  );
  const draftId = randomUUID(),
    requestKey = randomUUID();
  const writing = {
    id: draftId,
    requestId: randomUUID(),
    version: 0,
    title: 'SYNTHETIC private essay',
    kind: 'personal_statement',
    content: 'My 🙂 private essay for human review.',
    prompt: 'A specific experience',
    wordLimit: 500,
    applicationId: null,
    promptId: null,
    rubric: {},
    studio: { locale: 'en', archived: false },
    checkpoint: true,
  };
  data(await a.rpc('writing_studio_save', { p_input: writing }));
  const version = data(
    await a
      .from('writing_versions')
      .select('id')
      .eq('draft_id', draftId)
      .single(),
  );
  const scope = {
    op: 'create',
    service: service.id,
    goal: 'Please review the clarity of my essay',
    expires: new Date(Date.now() + 7 * 86400000).toISOString(),
    consent: true,
    policy: 'mentor-consent-v1',
    items: [
      {
        type: 'writing',
        resource: draftId,
        version: version.id,
        download: false,
      },
    ],
    key: requestKey,
  };
  check(
    Boolean((await a.rpc('mentor_command', { p_input: scope })).error),
    'missing safeguarding review fails closed through REST',
  );
  for (const student of [A, B])
    await command(moderator, {
      op: 'clearance',
      student,
      until: new Date(Date.now() + 30 * 86400000).toISOString(),
      guardianRequired: true,
      reason: 'SYNTHETIC CI school consent fixture only',
      attest: true,
    });
  const request = await command(a, scope),
    grant = data(
      await a
        .from('mentor_resource_grants')
        .select('id')
        .eq('request_id', request.id)
        .single(),
    );
  check(
    (await command(a, scope)).id === request.id,
    'request retry is idempotent through actual Auth/REST',
  );
  check(
    data(
      await x.rpc('mentor_resource', {
        p_grant: grant.id,
        p_operation: 'view',
      }),
    ).content === writing.content,
    'assigned mentor reads consented immutable version',
  );
  for (const [client, name] of [
    [b, 'student B'],
    [y, 'verified mentor Y'],
    [z, 'unverified mentor Z'],
  ])
    check(
      Boolean(
        (await client.rpc('mentor_resource', { p_grant: grant.id })).error,
      ),
      `${name} denied A grant`,
    );
  check(
    data(await x.from('writing_versions').select('id')).length === 0,
    'mentor cannot enumerate unshared writing',
  );
  check(
    data(await b.from('mentor_requests').select('id')).length === 0,
    'student B cannot enumerate A requests',
  );
  check(
    Boolean(
      (
        await y.rpc('mentor_evidence_access', {
          p_id: data(await x.from('mentor_evidence').select('id').single()).id,
        })
      ).error,
    ),
    'other mentor cannot read identity evidence',
  );
  await command(x, {
    op: 'transition',
    request: request.id,
    revision: 1,
    state: 'accepted',
  });
  await command(x, {
    op: 'transition',
    request: request.id,
    revision: 2,
    state: 'in_review',
  });
  await command(x, {
    op: 'comment',
    request: request.id,
    grant: grant.id,
    parent: null,
    body: 'Explain this experience in your own voice.',
    anchor: { start: 3, end: 4, quote: '🙂' },
    key: randomUUID(),
  });
  check(
    data(
      await a
        .from('mentor_comments')
        .select('author_id')
        .eq('request_id', request.id)
        .single(),
    ).author_id === X,
    'comment author cannot be forged',
  );
  check(
    Boolean(
      (
        await x.rpc('mentor_command', {
          p_input: {
            op: 'comment',
            request: request.id,
            grant: grant.id,
            parent: null,
            body: 'Message me on Telegram',
            anchor: null,
            key: randomUUID(),
          },
        })
      ).error,
    ),
    'off-platform contact request blocked',
  );
  // Actual Storage HTTP: grant checks never open direct bucket access or signing.
  const bytes = new TextEncoder().encode(
      'SYNTHETIC private transcript text · Әлем',
    ),
    hash = createHash('sha256').update(bytes).digest('hex'),
    vaultId = randomUUID();
  const vault = data(
    await a.rpc('vault_reserve', {
      p_document_id: null,
      p_category: 'transcript',
      p_name: 'SYNTHETIC transcript.txt',
      p_purpose: '',
      p_application_id: null,
      p_extension: 'txt',
      p_mime: 'text/plain',
      p_size: bytes.length,
      p_sha256: hash,
      p_request_id: vaultId,
      p_recommendation_id: null,
    }),
  );
  paths.push(vault.object_path);
  data(
    await a.storage
      .from('student-vault')
      .upload(vault.object_path, bytes, { contentType: 'text/plain' }),
  );
  data(await a.rpc('vault_finish', { p_version_id: vaultId, p_failed: false }));
  check(
    Boolean(
      (await x.storage.from('student-vault').download(vault.object_path)).error,
    ),
    'unshared quarantined transcript denies direct Storage HTTP',
  );
  data(
    await admin.rpc('vault_scan_result', {
      p_version_id: vaultId,
      p_sha256: hash,
      p_clean: true,
      p_scanner: 'SYNTHETIC permission fixture; not malware evidence',
    }),
  );
  check(
    Boolean(
      (await x.storage.from('student-vault').download(vault.object_path)).error,
    ),
    'guessed clean Storage path still denied',
  );
  check(
    Boolean(
      (
        await x.storage
          .from('student-vault')
          .createSignedUrl(vault.object_path, 60)
      ).error,
    ),
    'mentor cannot mint signed URLs',
  );
  await command(x, {
    op: 'service',
    kind: 'documents',
    summary: 'Synthetic document checklist review',
    deliverables: 'Checklist review with actionable notes',
    hours: 48,
    price: 0,
    currency: 'KZT',
  });
  const docService = data(await a.rpc('mentor_directory'))
    .find((m) => m.id === X)
    .services.find((s) => s.kind === 'documents');
  const fileRequest = await command(a, {
    ...scope,
    service: docService.id,
    items: [
      {
        type: 'vault',
        resource: vault.document_id,
        version: vaultId,
        download: false,
      },
    ],
    key: randomUUID(),
  });
  const fileGrant = data(
    await a
      .from('mentor_resource_grants')
      .select('id')
      .eq('request_id', fileRequest.id)
      .single(),
  );
  const bDraft = randomUUID();
  data(
    await b.rpc('writing_studio_save', {
      p_input: {
        ...writing,
        id: bDraft,
        requestId: randomUUID(),
        title: 'SYNTHETIC B essay',
      },
    }),
  );
  const bVersion = data(
    await b
      .from('writing_versions')
      .select('id')
      .eq('draft_id', bDraft)
      .single(),
  );
  const bRequest = await command(b, {
    ...scope,
    key: randomUUID(),
    items: [
      {
        type: 'writing',
        resource: bDraft,
        version: bVersion.id,
        download: false,
      },
    ],
  });
  await command(x, {
    op: 'transition',
    request: bRequest.id,
    revision: 1,
    state: 'accepted',
  });
  const slotStart = new Date(Date.now() + 4 * 3600000).toISOString(),
    slotEnd = new Date(Date.now() + 5 * 3600000).toISOString();
  await command(x, {
    op: 'slot',
    start: slotStart,
    end: slotEnd,
    timezone: 'Asia/Almaty',
  });
  const slot = data(
    await x
      .from('mentor_slots')
      .select('id')
      .eq('starts_at', slotStart)
      .single(),
  );
  const bookings = await Promise.all([
    a.rpc('mentor_command', {
      p_input: {
        op: 'book',
        request: request.id,
        slot: slot.id,
        key: randomUUID(),
      },
    }),
    b.rpc('mentor_command', {
      p_input: {
        op: 'book',
        request: bRequest.id,
        slot: slot.id,
        key: randomUUID(),
      },
    }),
  ]);
  check(
    bookings.filter((v) => !v.error).length === 1 &&
      bookings.filter((v) => v.error?.code === '23505').length === 1,
    'concurrent real students cannot double-book one slot',
  );
  await command(x, {
    op: 'weekly_slots',
    firstDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '11:00',
    weeks: 2,
    key: randomUUID(),
  });
  check(
    data(await x.from('mentor_availability_rules').select('id')).length === 1,
    'weekly availability persists through real REST',
  );
  await command(x, { op: 'blackout', start: slotStart, end: slotEnd });
  check(
    data(
      await x
        .from('mentor_slots')
        .select('cancelled_at')
        .eq('id', slot.id)
        .single(),
    ).cancelled_at !== null,
    'blackout cancels a booked occurrence',
  );
  sql(
    `update public.mentor_evidence set retain_until=now()-interval '1 day' where mentor_id='${X}';`,
  );
  execFileSync(
    process.execPath,
    [resolve(root, 'scripts/mentor-retention-local.mjs')],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  check(
    data(
      await verifier
        .from('mentor_evidence')
        .select('state')
        .eq('mentor_id', X)
        .single(),
    ).state === 'purged',
    'retention removes real Storage evidence before marking metadata purged',
  );
  // Application is served with real cookies derived from actual GoTrue sessions.
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: config.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3202',
    SUPABASE_SECRET_KEY: config.SECRET_KEY,
    NEXT_TELEMETRY_DISABLED: '1',
  };
  execFileSync(
    process.execPath,
    [resolve(root, 'node_modules/next/dist/bin/next'), 'build'],
    { cwd: root, env, stdio: ['ignore', 'ignore', 'pipe'], timeout: 180000 },
  );
  server = spawn(
    process.execPath,
    [
      resolve(root, 'node_modules/next/dist/bin/next'),
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      '3202',
    ],
    { cwd: root, env, stdio: 'ignore' },
  );
  let ready = false;
  for (let n = 0; n < 120; n++) {
    try {
      if ((await fetch('http://127.0.0.1:3202/api/health')).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server startup is still pending. */
    }
    await sleep(500);
  }
  assert.ok(ready, 'Local Next server must become ready');
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  async function context(client) {
    const cookies = [];
    const ssr = createServerClient(config.API_URL, publicKey, {
      cookies: {
        getAll: () => [],
        setAll: (values) => cookies.push(...values),
      },
    });
    data(
      await ssr.auth.setSession(data(await client.auth.getSession()).session),
    );
    const context = await browser.newContext();
    await context.addCookies(
      cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      })),
    );
    return context;
  }
  const studentContext = await context(a),
    mentorContext = await context(x),
    page = await studentContext.newPage();
  const ownerPreview = await studentContext.request.get(
    `http://127.0.0.1:3202/api/mentors/preview?type=writing&version=${version.id}`,
  );
  check(
    ownerPreview.status() === 200 &&
      (await ownerPreview.text()).includes(writing.content),
    'owner can preview the exact immutable writing version before sharing',
  );
  check(
    (
      await mentorContext.request.get(
        `http://127.0.0.1:3202/api/mentors/preview?type=writing&version=${version.id}`,
      )
    ).status() === 403,
    'an assigned mentor cannot use the owner-only pre-consent preview',
  );
  const ownerFilePreview = await studentContext.request.get(
    `http://127.0.0.1:3202/api/mentors/preview?type=vault&version=${vaultId}`,
  );
  check(
    ownerFilePreview.status() === 200 &&
      ownerFilePreview.headers()['content-type'].includes('charset=utf-8') &&
      (await ownerFilePreview.text()) === new TextDecoder().decode(bytes),
    'owner can preview exact clean Vault bytes before consent',
  );
  const fileUrl = `http://127.0.0.1:3202/api/mentors/file?grant=${fileGrant.id}`;
  const preview = await mentorContext.request.get(fileUrl);
  check(
    preview.status() === 200 &&
      (await preview.text()) === new TextDecoder().decode(bytes),
    'authenticated file proxy serves exact allowed clean bytes',
  );
  check(
    (await mentorContext.request.get(fileUrl + '&download=1')).status() === 403,
    'file attachment download requires separate explicit consent',
  );
  await command(a, { op: 'revoke', request: fileRequest.id });
  check(
    (await mentorContext.request.get(fileUrl)).status() === 403,
    'same proxy URL fails immediately after revocation; no stale signed URL',
  );
  await page.goto(`http://127.0.0.1:3202/en/mentoring?request=${request.id}`);
  await page
    .getByRole('heading', { name: 'Shared immutable version', exact: true })
    .waitFor();
  check(
    (await page
      .getByRole('textbox', { name: 'Selected quote (optional)', exact: true })
      .inputValue()) === writing.content,
    'real student browser shows consented original',
  );
  const mentorPage = await mentorContext.newPage();
  await mentorPage.goto(
    `http://127.0.0.1:3202/en/mentoring?tab=mentor&request=${request.id}`,
  );
  await mentorPage
    .getByRole('textbox', { name: 'Selected quote (optional)', exact: true })
    .waitFor();
  await page
    .getByRole('button', { name: 'Revoke access', exact: true })
    .click();
  await page.getByText('Access withdrawn', { exact: true }).first().waitFor();
  check(
    Boolean((await x.rpc('mentor_resource', { p_grant: grant.id })).error),
    'browser revocation blocks actual mentor REST read immediately',
  );
  const studioPage = await studentContext.newPage();
  await studioPage.goto(`http://127.0.0.1:3202/en/writing?draft=${draftId}`);
  await studioPage.getByRole('button', { name: 'Review', exact: true }).click();
  await studioPage
    .getByText('Explain this experience in your own voice.', { exact: true })
    .waitFor();
  check(
    true,
    'Writing Studio displays attributable human feedback after access revocation',
  );
  const commentId = data(
    await a
      .from('mentor_comments')
      .select('id')
      .eq('request_id', request.id)
      .single(),
  ).id;
  const caseResult = await command(a, {
    op: 'report',
    request: request.id,
    comment: commentId,
    reason: 'privacy',
    explanation: 'SYNTHETIC case fixture only',
  });
  check(
    data(await moderator.rpc('mentor_case_context', { p_case: caseResult.id }))
      .body === 'Explain this experience in your own voice.',
    'moderator reads the exact reported comment through an actual role-checked RPC',
  );
  check(
    Boolean(
      (await y.rpc('mentor_case_context', { p_case: caseResult.id })).error,
    ),
    'verified unrelated mentor cannot inspect case evidence',
  );
  await mentorPage.reload();
  await mentorPage
    .getByRole('heading', { name: 'Mentor queue', exact: true })
    .waitFor();
  check(
    (await mentorPage
      .getByRole('textbox', { name: 'Selected quote (optional)', exact: true })
      .count()) === 0,
    'second independent browser loses private view after revocation',
  );
  const second = await command(a, { ...scope, key: randomUUID() });
  const secondGrant = data(
    await a
      .from('mentor_resource_grants')
      .select('id')
      .eq('request_id', second.id)
      .single(),
  );
  const profile = data(
    await verifier
      .from('mentor_profiles')
      .select('revision')
      .eq('user_id', X)
      .single(),
  );
  await command(verifier, {
    op: 'verify',
    mentor: X,
    revision: profile.revision,
    state: 'suspended',
    summary: 'SYNTHETIC fixture verification suspended',
    reason: 'SYNTHETIC access revocation fixture',
    attest: true,
  });
  check(
    Boolean(
      (await x.rpc('mentor_resource', { p_grant: secondGrant.id })).error,
    ),
    'suspension denies existing JWT without refresh',
  );
  check(
    Boolean(
      (
        await a.rpc('mentor_command', {
          p_input: { ...scope, key: randomUUID() },
        })
      ).error,
    ),
    'suspension prevents new assignments',
  );
  data(await admin.auth.admin.deleteUser(X));
  check(
    data(
      await a
        .from('mentor_comments')
        .select('author_id')
        .eq('request_id', request.id)
        .single(),
    ).author_id === X,
    'real mentor Auth deletion preserves student-owned review attribution',
  );
  check(
    Boolean(
      (await x.rpc('mentor_resource', { p_grant: secondGrant.id })).error,
    ),
    'already-issued JWT cannot read work after real Auth deletion',
  );
  if (paths.length) {
    data(await admin.storage.from('student-vault').remove(paths));
    paths.length = 0;
  }
  data(await admin.auth.admin.deleteUser(A));
  check(
    data(await admin.from('mentor_requests').select('id').eq('student_id', A))
      .length === 0,
    'real student Auth deletion erases owned request and consent data',
  );
  console.log(
    `MENTOR AUTH/STORAGE/BROWSER: ${checks} checks passed; synthetic disposable identities only.`,
  );
} finally {
  await browser?.close();
  server?.kill('SIGTERM');
  if (paths.length)
    data(await admin.storage.from('student-vault').remove(paths));
  if (evidencePaths.length)
    data(await admin.storage.from('mentor-evidence').remove(evidencePaths));
  // Remaining synthetic identities live only on the disposable CI runner.
  for (const client of clients) await client.auth.signOut();
}
