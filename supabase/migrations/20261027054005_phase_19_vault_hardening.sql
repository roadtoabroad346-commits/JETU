begin;
alter table public.vault_documents add column purpose_application_id uuid,
  add column source_draft_id uuid,
  add foreign key(purpose_application_id,user_id) references public.applications(id,user_id),
  add foreign key(source_draft_id,user_id) references public.writing_drafts(id,user_id) on delete set null (source_draft_id);
create index vault_documents_purpose_app_idx on public.vault_documents(purpose_application_id,user_id);
create index vault_documents_draft_idx on public.vault_documents(source_draft_id,user_id);
alter table public.vault_versions add column scan_attempts integer not null default 0 check(scan_attempts>=0),
  add column next_scan_at timestamptz not null default now();
create index vault_scan_retry_idx on public.vault_versions(state,next_scan_at,created_at);
create or replace function public.vault_reserve(p_document_id uuid,p_category text,p_name text,p_purpose text,p_application_id uuid,
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
  insert into public.vault_versions(id,document_id,user_id,sequence,object_path,extension,mime,byte_size,sha256)
    values(p_request_id,d.id,u,n,'private/student/'||u::text||'/'||d.id::text||'/'||p_request_id::text||'/asset.'||p_extension,p_extension,p_mime,p_size,p_sha256) returning * into v;
  update public.vault_documents set current_version_id=v.id,updated_at=now() where id=d.id;
  insert into public.vault_events(user_id,document_id,event_type) values(u,d.id,'reserved');
  return v;
end; $$;


create function public.vault_draft_origin(p_document_id uuid,p_draft_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.writing_drafts;
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  select * into d from public.writing_drafts where id=p_draft_id and user_id=u;
  if not found then raise insufficient_privilege; end if;
  update public.vault_documents doc set source_draft_id=d.id where doc.id=p_document_id and doc.user_id=u and doc.category in ('cv','essay')
    and exists(select 1 from public.vault_versions v where v.id=doc.current_version_id and v.sha256=encode(sha256(convert_to(d.content,'UTF8')),'hex'));
  if not found then raise check_violation; end if;
end; $$;
revoke all on function public.vault_draft_origin(uuid,uuid) from public,anon;
grant execute on function public.vault_draft_origin(uuid,uuid) to authenticated;
commit;
