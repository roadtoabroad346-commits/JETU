-- Phase 15 compatibility hardening: the public Phase 14 RPC reports only the
-- outcome of factual age/grade range checks. It must not claim a complete
-- eligibility decision when other published or unknown criteria may apply.
begin;

do $migration$
declare
  definition text;
begin
  select pg_get_functiondef('public.opportunity_search(jsonb)'::regprocedure)
    into definition;

  if position('''ineligible''' in definition) = 0 then
    raise exception 'Expected opportunity_search range verdict was not found';
  end if;

  definition := replace(definition, '''ineligible''', '''outside_range''');
  execute definition;

  if position(
    '''ineligible''' in pg_get_functiondef('public.opportunity_search(jsonb)'::regprocedure)
  ) > 0 then
    raise exception 'opportunity_search still contains an eligibility claim';
  end if;
end
$migration$;

commit;
