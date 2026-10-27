-- Additive Phase 19. Rollback: disable routes/worker first; never drop stored data.
begin;
create function jetu_private.is_account_deletion_pending()
returns boolean language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.student_account_deletions where user_id=(select auth.uid()));
$$;
revoke all on function jetu_private.is_account_deletion_pending() from public,anon;
grant execute on function jetu_private.is_account_deletion_pending() to authenticated,service_role;

create table public.vault_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('transcript','certificate','cv','essay','language_test','portfolio','financial','identity','recommendation')),
  sensitivity text not null check (sensitivity in ('academic','personal','restricted','confidential')),
  display_name text not null check (length(btrim(display_name)) between 1 and 160 and display_name !~ '[[:cntrl:]/\\<>]'),
  purpose text not null default '' check (length(purpose)<=500),
  portfolio_url text check (portfolio_url is null or (length(portfolio_url)<=2048 and portfolio_url ~ '^https://[^[:space:]]+$')),
  current_version_id uuid,
  archived_at timestamptz,
  deleted_at timestamptz,
  purged_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id),
  check ((category in ('financial','identity') and sensitivity='restricted' and length(btrim(purpose))>=10)
    or (category='recommendation' and sensitivity='confidential')
    or (category in ('cv','essay') and sensitivity='personal')
    or (category in ('transcript','certificate','language_test','portfolio') and sensitivity='academic')),
  check (portfolio_url is null or category='portfolio')
);
create table public.vault_versions (
  id uuid primary key,
  document_id uuid not null,
  user_id uuid not null,
  sequence integer not null check (sequence between 1 and 20),
  object_path text not null unique,
  extension text not null check (extension in ('pdf','png','jpg','txt')),
  mime text not null check (mime in ('application/pdf','image/png','image/jpeg','text/plain')),
  byte_size integer not null check (byte_size between 1 and 3145728),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  state text not null default 'uploading' check (state in ('uploading','quarantined','available','rejected','failed')),
  scanner text check (scanner is null or length(scanner) between 1 and 120),
  scanned_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(document_id,user_id) references public.vault_documents(id,user_id) on delete cascade,
  unique(document_id,sequence), unique(id,document_id,user_id),
  check (object_path='private/student/'||user_id::text||'/'||document_id::text||'/'||id::text||'/asset.'||extension),
  check ((extension='pdf' and mime='application/pdf') or (extension='png' and mime='image/png')
    or (extension='jpg' and mime='image/jpeg') or (extension='txt' and mime='text/plain')),
  check (state<>'available' or (scanner is not null and scanned_at is not null))
);
alter table public.vault_documents add constraint vault_current_version_fk
  foreign key(current_version_id,id,user_id) references public.vault_versions(id,document_id,user_id);
create table public.vault_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null,
  version_id uuid not null,
  application_id uuid not null,
  task_id uuid,
  created_at timestamptz not null default now(),
  foreign key(document_id,user_id) references public.vault_documents(id,user_id) on delete cascade,
  foreign key(version_id,document_id,user_id) references public.vault_versions(id,document_id,user_id),
  foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade,
  foreign key(task_id,user_id) references public.roadmap_tasks(id,user_id) on delete cascade,
  unique(document_id,application_id)
);
create table public.vault_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.vault_documents(id) on delete cascade,
  event_type text not null check (event_type in ('reserved','quarantined','available','rejected','failed','archived','restored','deleted','purged','linked','unlinked')),
  created_at timestamptz not null default now()
);
create table public.writing_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  kind text not null check (kind in ('essay','sop','personal_statement','cv')),
  content text not null default '' check (octet_length(content)<=100000),
  prompt text not null default '' check (length(prompt)<=4000),
  word_limit integer check (word_limit between 1 and 20000),
  rubric jsonb not null default '{}' check (jsonb_typeof(rubric)='object' and octet_length(rubric::text)<=2000),
  application_id uuid,
  version integer not null default 1 check(version>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(application_id,user_id) references public.applications(id,user_id),
  unique(id,user_id)
);
create table public.writing_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null,
  user_id uuid not null,
  version integer not null,
  snapshot jsonb not null,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key(draft_id,user_id) references public.writing_drafts(id,user_id) on delete cascade,
  unique(draft_id,version), unique(user_id,request_id)
);
create table public.recommendation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null,
  invited_email text not null check(length(invited_email) between 3 and 254),
  context text not null check(length(btrim(context)) between 10 and 2000),
  due_date date,
  token_hash text unique check(token_hash is null or token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null default now()+interval '7 days',
  status text not null default 'requested' check(status in ('requested','accepted','declined','submitted','cancelled')),
  recommender_id uuid references auth.users(id),
  letter_document_id uuid references public.vault_documents(id),
  created_at timestamptz not null default now(),
  foreign key(application_id,user_id) references public.applications(id,user_id)
);
create index vault_documents_owner_idx on public.vault_documents(user_id,updated_at desc);
create index vault_versions_document_owner_idx on public.vault_versions(document_id,user_id);
create index vault_versions_scan_idx on public.vault_versions(state,created_at);
create index vault_versions_owner_idx on public.vault_versions(user_id);
create index vault_current_version_idx on public.vault_documents(current_version_id,id,user_id);
create index vault_links_version_idx on public.vault_links(version_id,document_id,user_id);
create index vault_links_owner_idx on public.vault_links(user_id,application_id);
create index vault_links_app_idx on public.vault_links(application_id,user_id);
create index vault_links_task_idx on public.vault_links(task_id,user_id);
create index vault_events_document_idx on public.vault_events(document_id);
create index vault_events_owner_idx on public.vault_events(user_id,created_at desc);
create index writing_drafts_owner_idx on public.writing_drafts(user_id,updated_at desc);
create index writing_drafts_app_idx on public.writing_drafts(application_id,user_id);
create index writing_versions_owner_idx on public.writing_versions(user_id,draft_id);
create index writing_versions_draft_owner_idx on public.writing_versions(draft_id,user_id);
create index recommendation_owner_idx on public.recommendation_requests(user_id,created_at desc);
create index recommendation_app_idx on public.recommendation_requests(application_id,user_id);
create index recommendation_recipient_idx on public.recommendation_requests(recommender_id);
create index recommendation_letter_idx on public.recommendation_requests(letter_document_id);

-- Private tables expose read-only columns. Mutations are bounded commands.
do $$ declare t text; begin
  foreach t in array array['vault_documents','vault_versions','vault_links','vault_events','writing_drafts','writing_versions','recommendation_requests'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy owner_read on public.%I for select to authenticated using (user_id=(select auth.uid()) and not jetu_private.is_account_deletion_pending())',t);
    if t<>'recommendation_requests' then execute format('grant select on public.%I to authenticated',t); end if;
  end loop;
end $$;
grant select(id,user_id,application_id,invited_email,context,due_date,expires_at,status,created_at)
  on public.recommendation_requests to authenticated;
grant usage,select on sequence public.vault_events_id_seq to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('student-vault','student-vault',false,3145728,array['application/pdf','image/png','image/jpeg','text/plain']);
-- No UPDATE or DELETE grants. Immutable paths, no upsert, quarantine has no read path.
create policy vault_insert on storage.objects for insert to authenticated with check (
  bucket_id='student-vault' and not jetu_private.is_account_deletion_pending()
  and exists(select 1 from public.vault_versions v join public.vault_documents d on d.id=v.document_id
    where v.user_id=(select auth.uid()) and v.object_path=name and v.state='uploading'
      and v.created_at>now()-interval '15 minutes' and d.deleted_at is null and d.archived_at is null and d.expires_at>now())
);
create policy vault_read on storage.objects for select to authenticated using (
  bucket_id='student-vault' and not jetu_private.is_account_deletion_pending()
  and current_setting('storage.operation',true) in ('object.get_authenticated','storage.object.get_authenticated')
  and exists(select 1 from public.vault_versions v join public.vault_documents d on d.id=v.document_id
    where v.user_id=(select auth.uid()) and v.object_path=name and v.state='available'
      and d.deleted_at is null and d.archived_at is null and d.expires_at>now())
);

create function public.vault_reserve(p_document_id uuid,p_category text,p_name text,p_purpose text,p_application_id uuid,
  p_extension text,p_mime text,p_size integer,p_sha256 text,p_request_id uuid,p_recommendation_id uuid default null)
returns public.vault_versions language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.vault_documents; v public.vault_versions; n integer; sensitivity_value text;
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,19));
  select * into v from public.vault_versions where id=p_request_id and user_id=u;
  if found then
    if v.sha256<>p_sha256 or v.byte_size<>p_size or v.extension<>p_extension or v.mime<>p_mime
      or (p_document_id is not null and v.document_id<>p_document_id) then raise exception using errcode='23514',message='idempotency mismatch'; end if;
    return v;
  end if;
  if (select count(*) from public.vault_versions where user_id=u and created_at>now()-interval '1 hour')>=30
    or (select coalesce(sum(byte_size),0) from public.vault_versions where user_id=u)>=104857600 then
    raise exception using errcode='P0001',message='quota exceeded'; end if;
  if p_application_id is not null and not exists(select 1 from public.applications where id=p_application_id and user_id=u and archived_at is null) then raise insufficient_privilege; end if;
  if p_document_id is null then
    if (select count(*) from public.vault_documents where user_id=u and purged_at is null)>=100 then raise exception using errcode='P0001',message='quota exceeded'; end if;
    if p_category='recommendation' then
      if not exists(select 1 from public.recommendation_requests where id=p_recommendation_id and recommender_id=u and status='accepted' and expires_at>now() and letter_document_id is null) then raise insufficient_privilege; end if;
      sensitivity_value:='confidential';
    elsif p_category in ('financial','identity') then
      if p_application_id is null or length(btrim(p_purpose))<10 then raise insufficient_privilege; end if;
      sensitivity_value:='restricted';
    elsif p_category in ('cv','essay') then sensitivity_value:='personal';
    else sensitivity_value:='academic'; end if;
    insert into public.vault_documents(user_id,category,sensitivity,display_name,purpose,expires_at)
      values(u,p_category,sensitivity_value,p_name,p_purpose,now()+case when sensitivity_value in ('restricted','confidential') then interval '90 days' else interval '365 days' end) returning * into d;
    if p_category='recommendation' then update public.recommendation_requests set letter_document_id=d.id where id=p_recommendation_id; end if;
  else
    select * into d from public.vault_documents where id=p_document_id and user_id=u for update;
    if not found or d.deleted_at is not null or d.archived_at is not null or d.expires_at<=now() or d.category<>p_category then raise insufficient_privilege; end if;
    if d.sensitivity='confidential' and not exists(select 1 from public.recommendation_requests where letter_document_id=d.id and recommender_id=u and status='accepted' and expires_at>now()) then raise insufficient_privilege; end if;
  end if;
  select coalesce(max(sequence),0)+1 into n from public.vault_versions where document_id=d.id;
  insert into public.vault_versions(id,document_id,user_id,sequence,object_path,extension,mime,byte_size,sha256)
    values(p_request_id,d.id,u,n,'private/student/'||u::text||'/'||d.id::text||'/'||p_request_id::text||'/asset.'||p_extension,p_extension,p_mime,p_size,p_sha256) returning * into v;
  update public.vault_documents set current_version_id=v.id,updated_at=now() where id=d.id;
  insert into public.vault_events(user_id,document_id,event_type) values(u,d.id,'reserved');
  return v;
end; $$;

create function public.vault_finish(p_version_id uuid,p_failed boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare v public.vault_versions;
begin
  if auth.uid() is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  select * into v from public.vault_versions where id=p_version_id and user_id=auth.uid() for update;
  if not found then raise insufficient_privilege; end if;
  if v.state<>'uploading' then return; end if;
  if not p_failed and not exists(select 1 from storage.objects where bucket_id='student-vault' and name=v.object_path) then raise check_violation; end if;
  update public.vault_versions set state=case when p_failed then 'failed' else 'quarantined' end where id=v.id;
  insert into public.vault_events(user_id,document_id,event_type) values(v.user_id,v.document_id,case when p_failed then 'failed' else 'quarantined' end);
end; $$;

-- Trusted scanner only. The worker downloads exact immutable bytes, validates them,
-- hashes them, runs ClamAV and fails closed before calling this command.
create function public.vault_scan_result(p_version_id uuid,p_sha256 text,p_clean boolean,p_scanner text)
returns void language plpgsql security definer set search_path='' as $$
declare v public.vault_versions; d public.vault_documents;
begin
  select * into v from public.vault_versions where id=p_version_id for update;
  if not found or v.state<>'quarantined' or v.sha256<>p_sha256 or length(btrim(p_scanner)) not between 1 and 120 then raise check_violation; end if;
  select * into d from public.vault_documents where id=v.document_id for update;
  if d.deleted_at is not null or d.expires_at<=now() then raise check_violation; end if;
  if d.sensitivity='confidential' and not exists(select 1 from public.recommendation_requests where letter_document_id=d.id and status='accepted' and expires_at>now()) then raise insufficient_privilege; end if;
  update public.vault_versions set state=case when p_clean then 'available' else 'rejected' end,scanner=p_scanner,scanned_at=now() where id=v.id;
  insert into public.vault_events(user_id,document_id,event_type) values(v.user_id,v.document_id,case when p_clean then 'available' else 'rejected' end);
  if p_clean then update public.recommendation_requests set status='submitted' where letter_document_id=d.id and status='accepted'; end if;
end; $$;

create function public.vault_manage(p_document_id uuid,p_action text)
returns void language plpgsql security definer set search_path='' as $$
declare d public.vault_documents;
begin
  if auth.uid() is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  select * into d from public.vault_documents where id=p_document_id and user_id=auth.uid() for update;
  if not found or d.deleted_at is not null then raise insufficient_privilege; end if;
  if p_action not in ('archive','restore','delete') then raise check_violation; end if;
  if p_action='restore' and d.expires_at<=now() then raise check_violation; end if;
  update public.vault_documents set archived_at=case when p_action='archive' then now() when p_action='restore' then null else archived_at end,
    deleted_at=case when p_action='delete' then now() else null end,updated_at=now() where id=d.id;
  insert into public.vault_events(user_id,document_id,event_type) values(d.user_id,d.id,case p_action when 'archive' then 'archived' when 'restore' then 'restored' else 'deleted' end);
end; $$;

create function public.vault_link(p_document_id uuid,p_version_id uuid,p_application_id uuid,p_task_id uuid,p_remove boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.vault_documents;
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  select * into d from public.vault_documents where id=p_document_id and user_id=u for update;
  if not found or d.sensitivity='confidential' then raise insufficient_privilege; end if;
  perform 1 from public.applications where id=p_application_id and user_id=u and archived_at is null for update;
  if not found then raise insufficient_privilege; end if;
  if p_remove then delete from public.vault_links where document_id=d.id and application_id=p_application_id and user_id=u;
  else
    if d.deleted_at is not null or d.archived_at is not null or d.expires_at<=now()
      or not exists(select 1 from public.vault_versions where id=p_version_id and document_id=d.id and user_id=u and state='available') then raise check_violation; end if;
    if p_task_id is not null and not exists(select 1 from public.roadmap_tasks t join public.roadmap_targets r on r.id=t.target_id
      join public.applications a on a.id=p_application_id where t.id=p_task_id and t.user_id=u and r.catalog_entity_id=a.program_id) then raise insufficient_privilege; end if;
    insert into public.vault_links(user_id,document_id,version_id,application_id,task_id) values(u,d.id,p_version_id,p_application_id,p_task_id)
      on conflict(document_id,application_id) do update set version_id=excluded.version_id,task_id=excluded.task_id;
  end if;
  insert into public.vault_events(user_id,document_id,event_type) values(u,d.id,case when p_remove then 'unlinked' else 'linked' end);
end; $$;

create function public.writing_save(p_id uuid,p_expected_version integer,p_title text,p_kind text,p_content text,p_prompt text,
  p_word_limit integer,p_rubric jsonb,p_application_id uuid,p_request_id uuid)
returns public.writing_drafts language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.writing_drafts; prior public.writing_versions;
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,21));
  select * into prior from public.writing_versions where user_id=u and request_id=p_request_id;
  if found then
    if prior.draft_id<>p_id or prior.snapshot->>'content'<>p_content or prior.snapshot->>'title'<>p_title
      or prior.snapshot->>'kind'<>p_kind or prior.snapshot->>'prompt'<>p_prompt
      or prior.snapshot->'rubric'<>p_rubric or (prior.snapshot->>'word_limit')::integer is distinct from p_word_limit
      or (prior.snapshot->>'application_id')::uuid is distinct from p_application_id then raise check_violation; end if;
    select * into d from public.writing_drafts where id=p_id and user_id=u; return d;
  end if;
  if (select count(*) from public.writing_versions where user_id=u and created_at>now()-interval '1 hour')>=120 then raise exception using errcode='P0001',message='quota exceeded'; end if;
  if p_application_id is not null and not exists(select 1 from public.applications where id=p_application_id and user_id=u and archived_at is null) then raise insufficient_privilege; end if;
  select * into d from public.writing_drafts where id=p_id for update;
  if found then
    if d.user_id<>u then raise insufficient_privilege; end if;
    if d.version<>p_expected_version then raise serialization_failure; end if;
    if d.version>=200 then raise exception using errcode='P0001',message='revision limit'; end if;
    update public.writing_drafts set title=p_title,kind=p_kind,content=p_content,prompt=p_prompt,word_limit=p_word_limit,
      rubric=p_rubric,application_id=p_application_id,version=version+1,updated_at=now() where id=d.id returning * into d;
  else
    if p_expected_version<>0 then raise serialization_failure; end if;
    if (select count(*) from public.writing_drafts where user_id=u)>=100 then raise exception using errcode='P0001',message='quota exceeded'; end if;
    insert into public.writing_drafts(id,user_id,title,kind,content,prompt,word_limit,rubric,application_id)
      values(p_id,u,p_title,p_kind,p_content,p_prompt,p_word_limit,p_rubric,p_application_id) returning * into d;
  end if;
  insert into public.writing_versions(draft_id,user_id,version,snapshot,request_id) values(d.id,u,d.version,to_jsonb(d)-'user_id',p_request_id);
  return d;
end; $$;

create function public.recommendation_create(p_application_id uuid,p_email text,p_context text,p_due_date date,p_token_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); result_id uuid;
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,22));
  if not exists(select 1 from public.applications where id=p_application_id and user_id=u and archived_at is null)
    or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and lower(email)<>lower(btrim(p_email))) then raise insufficient_privilege; end if;
  if (select count(*) from public.recommendation_requests where user_id=u and created_at>now()-interval '1 day')>=5 then raise exception using errcode='P0001',message='quota exceeded'; end if;
  insert into public.recommendation_requests(user_id,application_id,invited_email,context,due_date,token_hash)
    values(u,p_application_id,lower(btrim(p_email)),p_context,p_due_date,p_token_hash) returning id into result_id;
  return result_id;
end; $$;
create function public.recommendation_respond(p_token_hash text,p_accept boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.recommendation_requests; u uuid:=auth.uid();
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  select * into r from public.recommendation_requests where token_hash=p_token_hash and status='requested' and expires_at>now() for update;
  if not found or r.user_id=u or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and lower(email)=r.invited_email) then raise insufficient_privilege; end if;
  update public.recommendation_requests set status=case when p_accept then 'accepted' else 'declined' end,recommender_id=u,token_hash=null where id=r.id;
  return r.id;
end; $$;
create function public.recommendation_cancel(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  update public.recommendation_requests set status='cancelled',token_hash=null where id=p_id and user_id=auth.uid() and status in ('requested','accepted');
  if not found then raise insufficient_privilege; end if;
end; $$;

-- A linked document cannot silently satisfy readiness after deletion/expiry/archive.
create function jetu_private.vault_application_readiness()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('ready_for_review','ready_to_submit','submitted_external_confirmed') and exists(
    select 1 from public.vault_links l join public.vault_documents d on d.id=l.document_id
      join public.vault_versions v on v.id=l.version_id
    where l.application_id=new.id and (d.deleted_at is not null or d.archived_at is not null or d.expires_at<=now() or v.state<>'available')
  ) then raise exception using errcode='23514',message='linked document is not ready'; end if;
  return new;
end; $$;
create trigger vault_application_readiness before update of status on public.applications
  for each row execute function jetu_private.vault_application_readiness();

create function public.vault_portfolio(p_name text,p_url text)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); result_id uuid;
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,19));
  if (select count(*) from public.vault_documents where user_id=u and purged_at is null)>=100 then raise check_violation; end if;
  insert into public.vault_documents(user_id,category,sensitivity,display_name,portfolio_url,expires_at)
    values(u,'portfolio','academic',p_name,p_url,now()+interval '365 days') returning id into result_id;
  return result_id;
end; $$;
create function public.writing_delete(p_id uuid,p_expected_version integer)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  delete from public.writing_drafts where id=p_id and user_id=auth.uid() and version=p_expected_version;
  if not found then raise serialization_failure; end if;
end; $$;

-- Owner commands have explicit grants; scanner authority is never browser-callable.
do $$ declare f record; begin
  for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('vault_portfolio','writing_delete','vault_reserve','vault_finish','vault_scan_result','vault_manage','vault_link','writing_save','recommendation_create','recommendation_respond','recommendation_cancel') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to %I',f.signature,case when f.proname='vault_scan_result' then 'service_role' else 'authenticated' end);
  end loop;
end $$;
revoke all on function jetu_private.vault_application_readiness() from public,anon,authenticated,service_role;
commit;
