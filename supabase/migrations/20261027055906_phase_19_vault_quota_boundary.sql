begin;
-- Include the pending reservation in the hard byte budget.
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
    or (select coalesce(sum(qv.byte_size),0) from public.vault_versions qv join public.vault_documents qd on qd.id=qv.document_id where qv.user_id=u and qd.purged_at is null)+p_size>104857600 then
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


commit;
