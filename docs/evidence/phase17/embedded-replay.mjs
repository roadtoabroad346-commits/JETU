// Optional local fallback, not a substitute for Supabase CI or hosted Auth.
import { fileURLToPath } from 'node:url';
const moduleRoot = process.env.JETU_PGLITE_MODULE_ROOT;
if (!moduleRoot || !process.env.JETU_PGTAP_SQL)
  throw new Error(
    'Set JETU_PGLITE_MODULE_ROOT and JETU_PGTAP_SQL to disposable local dependencies.',
  );
const { PGlite } = await import(moduleRoot + '/dist/index.js');
const { pg_trgm } = await import(moduleRoot + '/dist/contrib/pg_trgm.js');
const { pgcrypto } = await import(moduleRoot + '/dist/contrib/pgcrypto.js');
import fs from 'node:fs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const db = new PGlite({ extensions: { pg_trgm, pgcrypto } });
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema storage; create schema extensions;
create table auth.users(instance_id uuid,id uuid primary key,aud text,role text,email text,encrypted_password text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid,owner_id text,metadata jsonb,created_at timestamptz default now(),updated_at timestamptz default now());
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
grant usage on schema auth,storage,extensions to anon,authenticated,service_role;
grant select on auth.users to service_role;
grant all on storage.objects,storage.buckets to service_role;
grant select,insert,update,delete on storage.objects to anon,authenticated;
`);
for (const f of fs.readdirSync(root + '/supabase/migrations').sort()) {
  try {
    await db.exec(fs.readFileSync(root + '/supabase/migrations/' + f, 'utf8'));
  } catch (e) {
    console.error('MIGRATION', f, e.message);
    process.exit(1);
  }
}
console.log(
  'All repository migrations replayed in embedded PostgreSQL (Auth/Storage schemas are synthetic).',
);
await db.exec('set search_path=extensions,public;');
await db.exec(fs.readFileSync(process.env.JETU_PGTAP_SQL, 'utf8'));
await db.exec(
  'grant execute on all functions in schema extensions to anon,authenticated,service_role; set search_path=public;',
);
for (const file of fs
  .readdirSync(root + '/supabase/tests')
  .filter((f) => f.endsWith('.sql'))
  .sort()) {
  if (!fs.existsSync(root + '/supabase/tests/' + file)) continue;
  const s = fs
    .readFileSync(root + '/supabase/tests/' + file, 'utf8')
    .replace(
      'create extension if not exists pgtap with schema extensions;',
      '',
    );
  try {
    const res = await db.exec(s);
    const values = res
      .flatMap((x) => x.rows)
      .flatMap((x) => Object.values(x))
      .map(String);
    if (values.some((v) => v.startsWith('not ok') || v.includes('Looks like')))
      throw new Error(
        values
          .filter((v) => v.startsWith('not ok') || v.includes('Looks like'))
          .join('\n'),
      );
    console.log(
      file,
      values.filter((v) => v.startsWith('ok ')).length,
      'pgTAP assertions pass',
    );
  } catch (e) {
    console.error('TEST', file, e.message);
    process.exit(1);
  }
}
const fn = await db.query(
  `select p.proargnames names, array(select format_type(t,null) from unnest(p.proargtypes) t) types from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='roadmap_apply_generation'`,
);
console.log(
  'Actual public roadmap procedure arguments:',
  JSON.stringify(fn.rows),
);
await db.close();
