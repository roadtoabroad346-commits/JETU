begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

select ok(not has_schema_privilege('anon', 'public', 'CREATE'), 'anon cannot create public objects');
select ok(not has_schema_privilege('authenticated', 'public', 'CREATE'), 'authenticated cannot create public objects');
select ok(has_schema_privilege('anon', 'public', 'USAGE'), 'anon may resolve explicitly granted public objects');
select ok(not has_schema_privilege('anon', 'jetu_private', 'USAGE'), 'anon cannot resolve private schema');
select ok(not has_schema_privilege('authenticated', 'jetu_private', 'USAGE'), 'authenticated cannot resolve private schema');
select ok(not has_schema_privilege('service_role', 'jetu_private', 'USAGE'), 'service role has no blanket private schema grant');

-- Transactional permission probes, not product tables or production fixtures.
create table public.__foundation_probe (id bigint generated always as identity primary key);
alter table public.__foundation_probe enable row level security;
create function public.__foundation_function() returns integer language sql security invoker set search_path = '' as 'select 1';

select ok(not has_table_privilege('anon', 'public.__foundation_probe', 'SELECT'), 'new table is not auto-readable by anon');
select ok(not has_table_privilege('authenticated', 'public.__foundation_probe', 'SELECT'), 'new table is not auto-readable by authenticated');
select ok(not has_table_privilege('authenticated', 'public.__foundation_probe', 'INSERT'), 'new table is not auto-writable by authenticated');
select ok(not has_sequence_privilege('authenticated', 'public.__foundation_probe_id_seq', 'USAGE'), 'new identity sequence is not auto-exposed');
select ok(not has_function_privilege('anon', 'public.__foundation_function()', 'EXECUTE'), 'new function has no inherited PUBLIC execute');
select ok(not has_function_privilege('authenticated', 'public.__foundation_function()', 'EXECUTE'), 'new function has no inherited authenticated execute');

-- The role change rolls back with the failed statement in pgTAP's subtransaction.
-- Keep the assertion itself as postgres: the private test extension needs no anon grant.
select throws_ok('set local role anon; select * from public.__foundation_probe', '42501', 'permission denied for table __foundation_probe', 'direct anonymous SELECT is denied');

select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity), 0,
  'all exposed public tables have RLS');

select * from finish();
rollback;
