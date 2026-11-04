begin;

create table public.catalog_editor_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('editor','reviewer','admin')),
  granted_at timestamptz not null default now()
);
alter table public.catalog_editor_memberships enable row level security;
revoke all on public.catalog_editor_memberships from public,anon,authenticated;
grant select on public.catalog_editor_memberships to authenticated;
grant all on public.catalog_editor_memberships to service_role;
create policy catalog_editor_own_membership on public.catalog_editor_memberships
  for select to authenticated using (user_id=(select auth.uid()));

create table public.catalog_editor_events (
  id bigint generated always as identity primary key,
  entity_id bigint not null references public.catalog_entities(id) on delete restrict,
  claim_id bigint references public.source_claims(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('review_claim','reject_claim','publish','unpublish')),
  note text not null check (length(btrim(note)) between 10 and 1000),
  before_snapshot jsonb not null,
  after_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index catalog_editor_events_entity_idx on public.catalog_editor_events(entity_id,id desc);
create index catalog_editor_events_claim_idx on public.catalog_editor_events(claim_id);
create index catalog_editor_events_actor_idx on public.catalog_editor_events(actor_id);
alter table public.catalog_editor_events enable row level security;
revoke all on public.catalog_editor_events from public,anon,authenticated;
grant select,insert on public.catalog_editor_events to service_role;
grant usage,select on sequence public.catalog_editor_events_id_seq to service_role;

create function jetu_private.catalog_editor_role()
returns text language sql stable security definer set search_path='' as $$
  select role from public.catalog_editor_memberships where user_id=(select auth.uid());
$$;
revoke all on function jetu_private.catalog_editor_role() from public,anon,authenticated;

create function jetu_private.catalog_record(p_id bigint,p_type text)
returns jsonb language sql stable security invoker set search_path='' as $$
  select case p_type
    when 'institution' then (select to_jsonb(t) from public.institutions t where id=p_id)
    when 'campus' then (select to_jsonb(t) from public.campuses t where id=p_id)
    when 'academic_unit' then (select to_jsonb(t) from public.academic_units t where id=p_id)
    when 'degree_program' then (select to_jsonb(t) from public.degree_programs t where id=p_id)
    when 'admission_intake' then (select to_jsonb(t) from public.admission_intakes t where id=p_id)
    when 'application_round' then (select to_jsonb(t) from public.application_rounds t where id=p_id)
    when 'scholarship' then (select to_jsonb(t) from public.scholarships t where id=p_id)
    when 'scholarship_cycle' then (select to_jsonb(t) from public.scholarship_cycles t where id=p_id)
    when 'scholarship_benefit' then (select to_jsonb(t) from public.scholarship_benefits t where id=p_id)
    when 'eligibility_requirement' then (select to_jsonb(t) from public.eligibility_requirements t where id=p_id)
    when 'deadline' then (select to_jsonb(t) from public.deadlines t where id=p_id)
    when 'opportunity' then (select to_jsonb(t) from public.opportunities t where id=p_id)
    else null end;
$$;
revoke all on function jetu_private.catalog_record(bigint,text) from public,anon,authenticated;

create function jetu_private.catalog_parents(p_id bigint)
returns bigint[] language sql stable security invoker set search_path='' as $$
  select coalesce(array_agg(distinct parent_id) filter(where parent_id is not null),'{}'::bigint[]) from (
    select institution_id as parent_id from public.campuses where id=p_id
    union all select institution_id from public.academic_units where id=p_id
    union all select campus_id from public.academic_units where id=p_id
    union all select academic_unit_id from public.degree_programs where id=p_id
    union all select campus_id from public.program_campuses where program_id=p_id
    union all select program_id from public.admission_intakes where id=p_id
    union all select intake_id from public.application_rounds where id=p_id
    union all select provider_institution_id from public.scholarships where id=p_id
    union all select scholarship_id from public.scholarship_cycles where id=p_id
    union all select scholarship_cycle_id from public.scholarship_benefits where id=p_id
  ) parents;
$$;
revoke all on function jetu_private.catalog_parents(bigint) from public,anon,authenticated;

create function public.catalog_editor_queue(p_before_id bigint default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_role text:=jetu_private.catalog_editor_role(); v_entities jsonb; v_ids bigint[];
begin
  if auth.uid() is null or v_role is null then
    raise exception using errcode='42501',message='catalog editor membership required';
  end if;
  select array_agg(id order by id desc) into v_ids from (
    select id from public.catalog_entities where p_before_id is null or id<p_before_id order by id desc limit 20
  ) page;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',e.id,'type',e.entity_type,'status',e.publication_status_code,
    'verification',e.verification_state_code,'revision',e.revision,
    'record',jetu_private.catalog_record(e.id,e.entity_type),
    'recordHash',md5(coalesce(jetu_private.catalog_record(e.id,e.entity_type),'null'::jsonb)::text),
    'parents',coalesce((select jsonb_agg(jsonb_build_object('id',parent.id,'type',parent.entity_type,'status',parent.publication_status_code,'verification',parent.verification_state_code))
      from public.catalog_entities parent where parent.id=any(jetu_private.catalog_parents(e.id))),'[]'::jsonb),
    'claims',coalesce((select jsonb_agg(jsonb_build_object(
      'id',sc.id,'key',sc.claim_key,'text',sc.claim_text,'hash',sc.content_hash,
      'state',sc.verification_state_code,'sourceUrl',os.canonical_url,
      'publisher',os.publisher_name,'checkedAt',os.last_checked_at,'sourceActive',os.is_active
    ) order by sc.id) from public.source_claims sc join public.official_sources os on os.id=sc.source_id
      where sc.catalog_entity_id=e.id),'[]'::jsonb)
  ) order by e.id desc),'[]'::jsonb) into v_entities
  from public.catalog_entities e where e.id=any(v_ids);
  return jsonb_build_object('role',v_role,'entities',v_entities,
    'nextCursor',case when cardinality(v_ids)=20 then (select min(id) from unnest(v_ids) id) else null end,
    'events',coalesce((select jsonb_agg(to_jsonb(event)) from (
      select id,entity_id,claim_id,action,note,before_snapshot,after_snapshot,created_at
      from public.catalog_editor_events where entity_id=any(v_ids) order by id desc limit 20
    ) event),'[]'::jsonb));
end;
$$;
revoke all on function public.catalog_editor_queue(bigint) from public,anon;
grant execute on function public.catalog_editor_queue(bigint) to authenticated;

create function public.catalog_editor_command(p_command jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_role text:=jetu_private.catalog_editor_role();
  v_entity public.catalog_entities%rowtype;
  v_claim public.source_claims%rowtype;
  v_source public.official_sources%rowtype;
  v_action text:=p_command->>'action';
  v_note text:=btrim(p_command->>'note');
  v_before jsonb; v_after jsonb; v_run bigint;
begin
  if auth.uid() is null or coalesce(v_role,'') not in ('reviewer','admin') then
    raise exception using errcode='42501',message='catalog reviewer membership required';
  end if;
  if v_action is null or v_action not in ('review_claim','reject_claim','publish','unpublish')
     or v_note is null or length(v_note) not between 10 and 1000
     or coalesce((p_command->>'attested')::boolean,false) is not true then
    raise exception using errcode='22023',message='explicit review attestation and note required';
  end if;
  select * into v_entity from public.catalog_entities where id=(p_command->>'entityId')::bigint for update;
  if not found then raise exception using errcode='P0002',message='catalog entity missing'; end if;
  if v_entity.revision is distinct from (p_command->>'expectedRevision')::bigint then
    raise exception using errcode='40001',message='catalog revision conflict';
  end if;
  v_before:=to_jsonb(v_entity)||jsonb_build_object('record',jetu_private.catalog_record(v_entity.id,v_entity.entity_type));

  if v_action in ('review_claim','reject_claim') then
    select * into v_claim from public.source_claims where id=(p_command->>'claimId')::bigint and catalog_entity_id=v_entity.id for update;
    if not found then raise exception using errcode='P0002',message='source claim missing'; end if;
    if v_claim.content_hash is distinct from p_command->>'expectedHash'
       or v_claim.verification_state_code is distinct from p_command->>'expectedState' then
      raise exception using errcode='40001',message='source claim changed';
    end if;
    select * into strict v_source from public.official_sources where id=v_claim.source_id for update;
    v_before:=v_before||jsonb_build_object('claim',to_jsonb(v_claim));
    if v_action='review_claim' then
      if not v_source.is_active or v_source.last_checked_at>now()+interval '5 minutes'
        or (v_source.effective_until is not null and v_source.effective_until<current_date)
        or (v_claim.effective_until is not null and v_claim.effective_until<current_date) then
        raise exception using errcode='23514',message='source or claim is inactive or expired';
      end if;
      insert into public.verification_runs(source_id,outcome,started_at,completed_at,reviewer_id,notes)
      values(v_source.id,'verified',now(),now(),auth.uid(),v_note) returning id into v_run;
      perform public.review_source_claim(v_claim.id,v_run);
    else
      -- Rejecting evidence must never leave an old verified public record behind.
      if v_entity.publication_status_code='published' then
        if exists(select 1 from public.catalog_entities child where child.publication_status_code='published'
          and v_entity.id=any(jetu_private.catalog_parents(child.id))) then
          raise exception using errcode='23514',message='unpublish dependent records before rejecting parent evidence';
        end if;
        update public.catalog_entities set publication_status_code='draft',verification_state_code='needs_review' where id=v_entity.id;
      end if;
      update public.source_claims set verification_state_code='rejected' where id=v_claim.id;
    end if;
    update public.catalog_entities set revision=revision+1 where id=v_entity.id;
  elsif v_action='publish' then
    if p_command->>'expectedRecordHash' is distinct from md5(coalesce(jetu_private.catalog_record(v_entity.id,v_entity.entity_type),'null'::jsonb)::text) then
      raise exception using errcode='40001',message='catalog record changed';
    end if;
    if jetu_private.catalog_record(v_entity.id,v_entity.entity_type) is null then
      raise exception using errcode='23514',message='unsupported editorial entity';
    end if;
    if exists(select 1 from public.source_claims where catalog_entity_id=v_entity.id and verification_state_code not in ('verified','rejected')) then
      raise exception using errcode='23514',message='all claims must be resolved before publication';
    end if;
    if exists(select 1 from public.catalog_entities parent where parent.id=any(jetu_private.catalog_parents(v_entity.id))
      and (parent.publication_status_code<>'published' or parent.verification_state_code<>'verified')) then
      raise exception using errcode='23514',message='publish reviewed parent records first';
    end if;
    if not exists(select 1 from public.source_claims sc join public.official_sources os on os.id=sc.source_id
      where sc.catalog_entity_id=v_entity.id and sc.verification_state_code='verified' and os.is_active
      and os.last_checked_at>=now()-interval '180 days'
      and (sc.effective_from is null or sc.effective_from<=current_date)
      and (sc.effective_until is null or sc.effective_until>=current_date)) then
      raise exception using errcode='23514',message='current verified official evidence required';
    end if;
    perform public.publish_catalog_entity(v_entity.id,now());
  else
    -- Do not silently orphan published child records.
    if exists(select 1 from public.catalog_entities child where child.publication_status_code='published'
      and v_entity.id=any(jetu_private.catalog_parents(child.id))) then
      raise exception using errcode='23514',message='unpublish dependent records first';
    end if;
    update public.catalog_entities set publication_status_code='draft',verification_state_code='needs_review' where id=v_entity.id;
  end if;
  select to_jsonb(e)||jsonb_build_object('record',jetu_private.catalog_record(e.id,e.entity_type)) into v_after
    from public.catalog_entities e where id=v_entity.id;
  if v_claim.id is not null then
    select v_after||jsonb_build_object('claim',to_jsonb(sc)) into v_after from public.source_claims sc where id=v_claim.id;
  end if;
  insert into public.catalog_editor_events(entity_id,claim_id,actor_id,action,note,before_snapshot,after_snapshot)
  values(v_entity.id,v_claim.id,auth.uid(),v_action,v_note,v_before,v_after);
  return jsonb_build_object('entityId',v_entity.id,'revision',(v_after->>'revision')::bigint);
end;
$$;
revoke all on function public.catalog_editor_command(jsonb) from public,anon;
grant execute on function public.catalog_editor_command(jsonb) to authenticated;
commit;
