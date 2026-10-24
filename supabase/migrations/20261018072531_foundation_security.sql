-- Phase 04: no product tables. Future grants and RLS must be explicit in migrations.
-- Execute only through the local workflow until separately reviewed for remote promotion.
begin;

revoke create on schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;

create schema if not exists jetu_private authorization postgres;
revoke all on schema jetu_private from public, anon, authenticated, service_role;

-- PUBLIC has global default EXECUTE; a schema-only REVOKE cannot override it.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;

-- Migration authors must enable RLS before granting access to an exposed table.
-- Never add blanket allow-all policies or browser grants to the private schema.
commit;
