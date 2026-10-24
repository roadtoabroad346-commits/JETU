-- Phase 13 extends the canonical Phase 10 catalog. No factual records are seeded.
begin;

alter table public.scholarships add column provider_name text;
alter table public.scholarships add column provider_country_code text check (provider_country_code ~ '^[A-Z]{2}$');
alter table public.scholarships drop constraint scholarships_check;
alter table public.scholarships add constraint scholarships_provider_check check (
  financial_aid_scheme_id is not null or provider_institution_id is not null
  or (provider_name is not null and length(btrim(provider_name)) between 2 and 240)
);
alter table public.scholarships add constraint scholarships_provider_name_check check (
  provider_name is null or length(btrim(provider_name)) between 2 and 240
);

create table public.scholarship_application_details (
  scholarship_id bigint primary key references public.scholarships(id) on delete cascade,
  application_method text not null default 'unknown' check (application_method in ('unknown','direct','automatic','nomination','institution')),
  admissions_linkage text not null default 'unknown' check (admissions_linkage in ('unknown','separate','with_admission','after_admission')),
  application_url text check (application_url is null or application_url ~ '^https://[^[:space:]]+$'),
  instructions text check (instructions is null or length(instructions) <= 4000),
  source_claim_id bigint,
  updated_at timestamptz not null default now()
);
alter table public.scholarship_application_details
  add constraint scholarship_application_claim_parent foreign key (source_claim_id,scholarship_id)
  references public.source_claims(id,catalog_entity_id) on delete restrict;
alter table public.scholarship_application_details
  add constraint scholarship_application_url_evidence check (application_url is null or source_claim_id is not null);

create table public.scholarship_document_requirements (
  id bigint generated always as identity primary key,
  scholarship_cycle_id bigint not null references public.scholarship_cycles(id) on delete cascade,
  document_name text not null check (length(btrim(document_name)) between 2 and 200),
  requirement_state text not null default 'unknown' check (requirement_state in ('required','conditional','optional','unknown')),
  source_claim_id bigint,
  unique (scholarship_cycle_id, document_name)
);
alter table public.scholarship_document_requirements
  add constraint scholarship_document_claim_parent foreign key (source_claim_id,scholarship_cycle_id)
  references public.source_claims(id,catalog_entity_id) on delete restrict;
alter table public.scholarship_document_requirements
  add constraint scholarship_document_evidence check (requirement_state='unknown' or source_claim_id is not null);

create function jetu_private.check_deadline_timezone()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.timezone_name is not null and not exists (
    select 1 from pg_catalog.pg_timezone_names where name=new.timezone_name
  ) then
    raise exception using errcode='22023',message='deadline timezone must be an IANA zone';
  end if;
  return new;
end;
$$;
create trigger scholarship_deadline_timezone before insert or update of timezone_name
on public.deadlines for each row execute function jetu_private.check_deadline_timezone();
revoke all on function jetu_private.check_deadline_timezone() from public,anon,authenticated;

create table public.scholarship_editor_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('editor','reviewer','admin')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null
);

create table public.scholarship_editor_notes (
  scholarship_id bigint primary key references public.scholarships(id) on delete cascade,
  note text not null check (length(btrim(note)) between 1 and 4000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.scholarship_editorial_events (
  id bigint generated always as identity primary key,
  scholarship_id bigint not null references public.scholarships(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('created','reviewed','published','unpublished','archived','reverified')),
  note text check (note is null or length(note) <= 4000),
  created_at timestamptz not null default now()
);
create index scholarship_editorial_events_parent_idx on public.scholarship_editorial_events(scholarship_id,created_at desc);

create table public.student_scholarship_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  scholarship_id bigint not null references public.scholarships(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,scholarship_id)
);
create index student_scholarship_saves_scholarship_idx on public.student_scholarship_saves(scholarship_id);

alter table public.scholarship_application_details enable row level security;
alter table public.scholarship_document_requirements enable row level security;
alter table public.scholarship_editor_memberships enable row level security;
alter table public.scholarship_editor_notes enable row level security;
alter table public.scholarship_editorial_events enable row level security;
alter table public.student_scholarship_saves enable row level security;

create policy scholarship_application_public_read on public.scholarship_application_details
for select to anon,authenticated using (
  exists (select 1 from public.scholarships s where s.id=scholarship_id)
  and (source_claim_id is null or exists (select 1 from public.source_claims sc where sc.id=source_claim_id))
);
create policy scholarship_documents_public_read on public.scholarship_document_requirements
for select to anon,authenticated using (
  exists (select 1 from public.scholarship_cycles sc where sc.id=scholarship_cycle_id)
  and (source_claim_id is null or exists (select 1 from public.source_claims c where c.id=source_claim_id))
);
create policy scholarship_membership_self_read on public.scholarship_editor_memberships
for select to authenticated using (user_id=(select auth.uid()));
create policy scholarship_save_own on public.student_scholarship_saves
for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

revoke all on public.scholarship_application_details,public.scholarship_document_requirements,
  public.scholarship_editor_memberships,public.scholarship_editor_notes,public.scholarship_editorial_events,public.student_scholarship_saves
  from public,anon,authenticated;
grant select on public.scholarship_application_details,public.scholarship_document_requirements to anon,authenticated;
grant select on public.scholarship_editor_memberships to authenticated;
grant select,insert,delete on public.student_scholarship_saves to authenticated;
grant all on public.scholarship_application_details,public.scholarship_document_requirements,
  public.scholarship_editor_memberships,public.scholarship_editor_notes,public.scholarship_editorial_events,public.student_scholarship_saves to service_role;
grant usage,select on sequence public.scholarship_document_requirements_id_seq to service_role;
grant usage,select on sequence public.scholarship_editorial_events_id_seq to service_role;

create function public.scholarship_create_draft(p_bundle jsonb, p_actor uuid)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare v_id bigint; v_source_id bigint; v_checked timestamptz; v_excerpt text;
begin
  if jsonb_typeof(p_bundle) <> 'object'
     or nullif(p_bundle->>'slug','') is null
     or nullif(p_bundle->>'title','') is null
     or nullif(p_bundle->>'provider_name','') is null
     or nullif(p_bundle->>'official_url','') is null
     or nullif(p_bundle#>>'{source,url}','') is null
     or nullif(p_bundle#>>'{source,title}','') is null
     or nullif(p_bundle#>>'{source,publisher}','') is null
     or nullif(p_bundle#>>'{source,excerpt}','') is null then
    raise exception using errcode='22023',message='missing required scholarship evidence';
  end if;
  if exists (select 1 from public.scholarships where slug=p_bundle->>'slug') then
    raise exception using errcode='23505',message='scholarship slug already exists';
  end if;
  v_checked := coalesce((p_bundle#>>'{source,checked_at}')::timestamptz,now());
  if v_checked>now() or v_checked<now()-interval '180 days' then
    raise exception using errcode='22023',message='source check timestamp must be recent';
  end if;
  v_excerpt := p_bundle#>>'{source,excerpt}';
  insert into public.official_sources(canonical_url,publisher_name,source_title,locale,first_seen_at,last_checked_at)
  values (p_bundle#>>'{source,url}',p_bundle#>>'{source,publisher}',p_bundle#>>'{source,title}',
    coalesce(nullif(p_bundle#>>'{source,locale}',''),'en'),v_checked,v_checked)
  on conflict (canonical_url) do update set updated_at=public.official_sources.updated_at
  returning id into v_source_id;
  insert into public.catalog_entities(entity_type) values ('scholarship') returning id into v_id;
  insert into public.scholarships(id,slug,title,award_type,official_url,provider_name,provider_country_code)
  values(v_id,p_bundle->>'slug',p_bundle->>'title',coalesce(nullif(p_bundle->>'award_type',''),'scholarship'),
    p_bundle->>'official_url',p_bundle->>'provider_name',nullif(p_bundle->>'provider_country_code',''));
  insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash)
  values(v_source_id,v_id,'record',v_excerpt,md5(v_excerpt));
  insert into public.scholarship_editorial_events(scholarship_id,actor_id,action)
  values(v_id,p_actor,'created');
  return v_id;
end;
$$;
revoke all on function public.scholarship_create_draft(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.scholarship_create_draft(jsonb,uuid) to service_role;

create function public.scholarship_transition(p_id bigint,p_action text,p_actor uuid,p_note text default null)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare v_claim record; v_run bigint;
begin
  if not exists(select 1 from public.scholarships where id=p_id) then
    raise exception using errcode='P0002',message='scholarship not found';
  end if;
  if p_action in ('reviewed','reverified') then
    if length(btrim(coalesce(p_note,'')))<10 then
      raise exception using errcode='22023',message='review note is required';
    end if;
    select sc.id,sc.source_id into v_claim from public.source_claims sc
    join public.official_sources os on os.id=sc.source_id and os.is_active
    where sc.catalog_entity_id=p_id order by sc.observed_at desc,sc.id desc limit 1;
    if v_claim.id is null then
      raise exception using errcode='23514',message='official source claim required';
    end if;
    insert into public.verification_runs(source_id,outcome,started_at,completed_at,reviewer_id,notes)
    values(v_claim.source_id,'verified',now(),now(),p_actor,p_note) returning id into v_run;
    perform public.review_source_claim(v_claim.id,v_run);
    if p_action='reverified' then
      update public.catalog_entities set last_checked_at=now(),verification_state_code='verified' where id=p_id;
    end if;
  elsif p_action='published' then
    perform public.publish_catalog_entity(p_id,now());
  elsif p_action='unpublished' then
    update public.catalog_entities set publication_status_code='draft' where id=p_id;
  elsif p_action='archived' then
    update public.catalog_entities set publication_status_code='archived',archived_at=now() where id=p_id;
  else
    raise exception using errcode='22023',message='unknown scholarship transition';
  end if;
  insert into public.scholarship_editorial_events(scholarship_id,actor_id,action,note)
  values(p_id,p_actor,p_action,p_note);
  return p_id;
end;
$$;
revoke all on function public.scholarship_transition(bigint,text,uuid,text) from public,anon,authenticated;
grant execute on function public.scholarship_transition(bigint,text,uuid,text) to service_role;

create function public.scholarship_search(p_query text default '', p_limit integer default 24, p_offset integer default 0, p_slug text default null, p_country text default null, p_award_type text default null, p_sort text default 'recent')
returns table (
 id bigint, slug text, title text, award_type text, provider_name text,
 provider_country_code text, official_url text, source_url text,
 source_checked_at timestamptz, deadline_at timestamptz, deadline_timezone text,
 benefit_summary text, total_count bigint
) language sql stable security invoker set search_path = '' as $$
  select s.id,s.slug,s.title,s.award_type,
    coalesce(s.provider_name,i.legal_name) as provider_name,
    coalesce(s.provider_country_code,c.iso2) as provider_country_code,
    s.official_url, evidence.canonical_url,evidence.last_checked_at,
    next_deadline.due_at,next_deadline.timezone_name, benefits.summary,
    count(*) over() as total_count
  from public.scholarships s
  join public.catalog_entities ce on ce.id=s.id
  left join public.institutions i on i.id=s.provider_institution_id
  left join public.countries c on c.id=i.country_id
  join lateral (
    select os.canonical_url,os.last_checked_at
    from public.source_claims sc join public.official_sources os on os.id=sc.source_id
    where sc.catalog_entity_id=s.id and sc.verification_state_code='verified'
    order by os.last_checked_at desc,os.id desc limit 1
  ) evidence on true
  left join lateral (
    select d.due_at,d.timezone_name from public.scholarship_cycles cy
    join public.scholarship_cycle_deadlines cd on cd.scholarship_cycle_id=cy.id
    join public.deadlines d on d.id=cd.deadline_id
    where cy.scholarship_id=s.id and d.due_at>=now()
    order by d.due_at limit 1
  ) next_deadline on true
  left join lateral (
    select string_agg(distinct ci.label,', ' order by ci.label) as summary
    from public.scholarship_cycles cy
    join public.scholarship_benefits b on b.scholarship_cycle_id=cy.id
    join public.coverage_items ci on ci.code=b.coverage_item_code
    where cy.scholarship_id=s.id
  ) benefits on true
  where ce.publication_status_code='published' and ce.verification_state_code='verified'
    and (p_slug is null or s.slug=p_slug)
    and (p_country is null or coalesce(s.provider_country_code,c.iso2)=p_country)
    and (p_award_type is null or s.award_type=p_award_type)
    and (coalesce(p_query,'')='' or s.slug=p_query or s.title ilike '%'||p_query||'%' or coalesce(s.provider_name,i.legal_name,'') ilike '%'||p_query||'%')
  order by
    case when p_sort='title' then s.title end asc,
    case when p_sort='deadline' then next_deadline.due_at end asc nulls last,
    case when p_sort='recent' then evidence.last_checked_at end desc,
    s.id desc
  limit least(greatest(p_limit,1),48) offset least(greatest(p_offset,0),960);
$$;
revoke all on function public.scholarship_search(text,integer,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.scholarship_search(text,integer,integer,text,text,text,text) to anon,authenticated;

create index scholarship_cycles_scholarship_idx on public.scholarship_cycles(scholarship_id);
create index scholarship_claims_entity_state_idx on public.source_claims(catalog_entity_id,verification_state_code,source_id);
create index scholarship_deadlines_cycle_idx on public.scholarship_cycle_deadlines(scholarship_cycle_id,deadline_id);
commit;
