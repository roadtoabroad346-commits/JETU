begin;

create index matching_runs_rules_version_idx on public.matching_runs(rules_version);
create index matching_results_entity_idx on public.matching_results(entity_id);
create index matching_results_run_owner_idx on public.matching_results(run_id,user_id);

create function jetu_private.enforce_matching_run_limit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.created_at not between now() - interval '1 minute' and now() + interval '1 minute' then
    raise exception using errcode = '23514', message = 'matching run timestamp must be current';
  end if;
  if (select count(*) from public.matching_runs
      where user_id = new.user_id and created_at >= now() - interval '1 day') >= 20 then
    raise exception using errcode = '23514', message = 'matching daily limit reached';
  end if;
  return new;
end;
$$;
revoke all on function jetu_private.enforce_matching_run_limit() from public, anon, authenticated, service_role;
create trigger matching_run_limit before insert on public.matching_runs
for each row execute function jetu_private.enforce_matching_run_limit();

create function jetu_private.check_matching_result_entity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.catalog_entities ce where ce.id = new.entity_id
    and ce.entity_type = case new.entity_type when 'program' then 'degree_program' else 'scholarship' end
    and ce.publication_status_code = 'published') then
    raise exception using errcode = '23514', message = 'matching result must reference a published entity of the same type';
  end if;
  return new;
end;
$$;
revoke all on function jetu_private.check_matching_result_entity() from public, anon, authenticated, service_role;
create trigger matching_result_entity before insert on public.matching_results
for each row execute function jetu_private.check_matching_result_entity();

commit;
