begin;
alter table public.vault_versions add column request_fingerprint text check(request_fingerprint is null or request_fingerprint ~ '^[a-f0-9]{64}$');
create or replace function public.vault_reserve(p_document_id uuid,p_category text,p_name text,p_purpose text,p_application_id uuid,
  p_extension text,p_mime text,p_size integer,p_sha256 text,p_request_id uuid,p_recommendation_id uuid default null)
returns public.vault_versions language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.vault_documents; v public.vault_versions; n integer; sensitivity_value text; fingerprint text;
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,19));
  fingerprint:=encode(sha256(convert_to(jsonb_build_array(p_document_id,p_category,p_name,p_purpose,p_application_id,p_extension,p_mime,p_size,p_sha256,p_recommendation_id)::text,'UTF8')),'hex');
  select * into v from public.vault_versions where id=p_request_id and user_id=u;
  if found then
    if v.request_fingerprint is distinct from fingerprint then raise check_violation; end if;
    return v;
  end if;
  if (select count(*) from public.vault_versions where user_id=u and created_at>now()-interval '1 hour')>=30
    or (select coalesce(sum(qv.byte_size),0) from public.vault_versions qv join public.vault_documents qd on qd.id=qv.document_id where qv.user_id=u and qd.purged_at is null)>=104857600 then
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
    insert into public.vault_documents(user_id,category,sensitivity,display_name,purpose,purpose_application_id,expires_at)
      values(u,p_category,sensitivity_value,p_name,p_purpose,p_application_id,now()+case when sensitivity_value in ('restricted','confidential') then interval '90 days' else interval '365 days' end) returning * into d;
    if p_category='recommendation' then update public.recommendation_requests set letter_document_id=d.id where id=p_recommendation_id; end if;
  else
    select * into d from public.vault_documents where id=p_document_id and user_id=u for update;
    if not found or d.deleted_at is not null or d.archived_at is not null or d.expires_at<=now() or d.category<>p_category then raise insufficient_privilege; end if;
    if d.sensitivity='confidential' and not exists(select 1 from public.recommendation_requests where letter_document_id=d.id and recommender_id=u and status='accepted' and expires_at>now()) then raise insufficient_privilege; end if;
  end if;
  select coalesce(max(sequence),0)+1 into n from public.vault_versions where document_id=d.id;
  insert into public.vault_versions(id,document_id,user_id,sequence,object_path,extension,mime,byte_size,sha256,request_fingerprint)
    values(p_request_id,d.id,u,n,'private/student/'||u::text||'/'||d.id::text||'/'||p_request_id::text||'/asset.'||p_extension,p_extension,p_mime,p_size,p_sha256,fingerprint) returning * into v;
  update public.vault_documents set current_version_id=v.id,updated_at=now() where id=d.id;
  insert into public.vault_events(user_id,document_id,event_type) values(u,d.id,'reserved');
  return v;
end; $$;


create or replace function public.writing_save(p_id uuid,p_expected_version integer,p_title text,p_kind text,p_content text,p_prompt text,
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
    if d.version is distinct from p_expected_version then raise serialization_failure; end if;
    if d.version>=200 then raise exception using errcode='P0001',message='revision limit'; end if;
    update public.writing_drafts set title=p_title,kind=p_kind,content=p_content,prompt=p_prompt,word_limit=p_word_limit,
      rubric=p_rubric,application_id=p_application_id,version=version+1,updated_at=now() where id=d.id returning * into d;
  else
    if p_expected_version is distinct from 0 then raise serialization_failure; end if;
    if (select count(*) from public.writing_drafts where user_id=u)>=100 then raise exception using errcode='P0001',message='quota exceeded'; end if;
    insert into public.writing_drafts(id,user_id,title,kind,content,prompt,word_limit,rubric,application_id)
      values(p_id,u,p_title,p_kind,p_content,p_prompt,p_word_limit,p_rubric,p_application_id) returning * into d;
  end if;
  insert into public.writing_versions(draft_id,user_id,version,snapshot,request_id) values(d.id,u,d.version,to_jsonb(d)-'user_id',p_request_id);
  return d;
end; $$;


create table public.recommendation_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.recommendation_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check(event_type in ('requested','accepted','declined','submitted','cancelled')),
  occurred_at timestamptz not null default now()
);
create index recommendation_events_request_idx on public.recommendation_events(request_id);
create index recommendation_events_owner_idx on public.recommendation_events(user_id,occurred_at);
alter table public.recommendation_events enable row level security;
revoke all on public.recommendation_events from anon,authenticated;
grant select on public.recommendation_events to authenticated;
grant all on public.recommendation_events to service_role;
grant usage,select on sequence public.recommendation_events_id_seq to service_role;
create policy owner_read on public.recommendation_events for select to authenticated
  using(user_id=(select auth.uid()) and not jetu_private.is_account_deletion_pending());
create function jetu_private.capture_recommendation_event()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if TG_OP='INSERT' or new.status is distinct from old.status then
    insert into public.recommendation_events(request_id,user_id,event_type) values(new.id,new.user_id,new.status);
  end if;
  return new;
end; $$;
revoke all on function jetu_private.capture_recommendation_event() from public,anon,authenticated,service_role;
create trigger capture_recommendation_event after insert or update of status on public.recommendation_requests
  for each row execute function jetu_private.capture_recommendation_event();
create trigger recommendation_events_immutable before update or delete on public.recommendation_events
  for each row execute function jetu_private.prevent_event_mutation();
-- Existing Phase 18 append-only triggers blocked account-erasure cascades.
-- Only the deletion of the Auth owner permits physical history removal.
create or replace function jetu_private.prevent_event_mutation()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if TG_OP='DELETE' and not exists(select 1 from auth.users where id=old.user_id) then return old; end if;
  raise exception using errcode='42501',message='history is append-only';
end; $$;
alter table public.recommendation_requests drop constraint recommendation_requests_recommender_id_fkey,
  add foreign key(recommender_id) references auth.users(id) on delete set null;
alter table public.recommendation_requests drop constraint recommendation_requests_letter_document_id_fkey,
  add foreign key(letter_document_id) references public.vault_documents(id) on delete set null;
commit;
