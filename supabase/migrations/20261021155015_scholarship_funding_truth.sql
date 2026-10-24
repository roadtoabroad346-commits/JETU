-- Phase 13: explicit funding claims and a publication-time evidence gate.
begin;
create table public.scholarship_funding_profiles (
  scholarship_id bigint primary key references public.scholarships(id) on delete cascade,
  funding_label text not null default 'unknown'
    check (funding_label in ('unknown','partial','full_tuition','tuition_stipend','comprehensive')),
  duration_note text check (duration_note is null or length(duration_note)<=2000),
  renewal_conditions text check (renewal_conditions is null or length(renewal_conditions)<=2000),
  uncovered_costs_note text check (uncovered_costs_note is null or length(uncovered_costs_note)<=2000),
  annual_change_note text check (annual_change_note is null or length(annual_change_note)<=2000),
  source_claim_id bigint,
  constraint scholarship_funding_claim_parent foreign key (source_claim_id,scholarship_id)
    references public.source_claims(id,catalog_entity_id) on delete restrict,
  check (funding_label='unknown' or source_claim_id is not null)
);
create index scholarship_funding_claim_idx on public.scholarship_funding_profiles(source_claim_id,scholarship_id);
alter table public.scholarship_funding_profiles enable row level security;
create policy scholarship_funding_public_read on public.scholarship_funding_profiles for select to anon,authenticated
using (exists (select 1 from public.scholarships s where s.id=scholarship_id)
  and (source_claim_id is null or exists(select 1 from public.source_claims sc where sc.id=source_claim_id)));
revoke all on public.scholarship_funding_profiles from public,anon,authenticated;
grant select on public.scholarship_funding_profiles to anon,authenticated;
grant all on public.scholarship_funding_profiles to service_role;

create function jetu_private.check_scholarship_publication()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_label text; v_claim bigint;
begin
  if new.entity_type <> 'scholarship' or new.publication_status_code <> 'published' then
    return new;
  end if;
  if not exists (
    select 1 from public.source_claims sc join public.official_sources os on os.id=sc.source_id
    where sc.catalog_entity_id=new.id and sc.verification_state_code='verified'
      and os.is_active and os.last_checked_at>=now()-interval '180 days'
  ) then
    raise exception using errcode='23514',message='recent verified official scholarship source required';
  end if;
  if exists (select 1 from public.source_claims sc where sc.catalog_entity_id=new.id and sc.verification_state_code='conflicted') then
    raise exception using errcode='23514',message='conflicted scholarship evidence cannot be published';
  end if;
  select funding_label,source_claim_id into v_label,v_claim
  from public.scholarship_funding_profiles where scholarship_id=new.id;
  if v_label is null or v_label='unknown' then return new; end if;
  if not exists(select 1 from public.source_claims sc where sc.id=v_claim and sc.verification_state_code='verified') then
    raise exception using errcode='23514',message='verified funding claim required';
  end if;
  if v_label in ('full_tuition','tuition_stipend','comprehensive') and not exists (
    select 1 from public.scholarship_cycles cy
    join public.scholarship_benefits b on b.scholarship_cycle_id=cy.id
    where cy.scholarship_id=new.id and b.coverage_item_code='tuition' and b.coverage_percent=100
  ) then
    raise exception using errcode='23514',message='full tuition claim requires explicit 100 percent tuition benefit';
  end if;
  if v_label in ('tuition_stipend','comprehensive') and not exists (
    select 1 from public.scholarship_cycles cy
    join public.scholarship_benefits b on b.scholarship_cycle_id=cy.id
    where cy.scholarship_id=new.id and b.coverage_item_code='living_stipend'
  ) then
    raise exception using errcode='23514',message='stipend claim requires a living stipend benefit';
  end if;
  if v_label='comprehensive' and not exists (
    select 1 from public.scholarship_cycles cy
    join public.scholarship_benefits b on b.scholarship_cycle_id=cy.id
    where cy.scholarship_id=new.id and b.coverage_item_code='housing'
  ) then
    raise exception using errcode='23514',message='comprehensive claim requires housing benefit';
  end if;
  return new;
end;
$$;
create trigger scholarship_publication_truth before insert or update of publication_status_code,verification_state_code,last_checked_at
on public.catalog_entities for each row execute function jetu_private.check_scholarship_publication();
revoke all on function jetu_private.check_scholarship_publication() from public,anon,authenticated;
commit;
