-- Keep pseudonymous audit attribution after Auth deletion without retaining a
-- former mentor's public bio or permitting stale JWTs to regain access.
begin;
-- These columns identify the historical actor, not a living Auth membership.
-- Browser roles cannot write them; commands always assign the real Auth identity.
alter table public.mentor_profiles drop constraint mentor_profiles_user_id_fkey;
alter table public.mentor_profiles drop constraint mentor_profiles_reviewed_by_fkey;
alter table public.mentor_student_clearances drop constraint mentor_student_clearances_reviewed_by_fkey;
alter table public.mentor_comments drop constraint mentor_comments_author_id_fkey;
alter table public.mentor_reviews drop constraint mentor_reviews_author_id_fkey;
alter table public.mentor_events drop constraint mentor_events_actor_id_fkey;
alter table jetu_private.mentor_staff drop constraint mentor_staff_granted_by_fkey;
alter table jetu_private.mentor_staff add foreign key(granted_by) references auth.users(id) on delete set null;

create function jetu_private.mentor_auth_removed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(220022);
 update public.mentor_requests set revoked_at=coalesce(revoked_at,now()),revision=revision+1,updated_at=now() where mentor_id=old.id;
 update public.mentor_resource_grants set revoked_at=coalesce(revoked_at,now()) where mentor_id=old.id;
 update public.mentor_bookings set state='cancelled' where request_id in(select id from public.mentor_requests where mentor_id=old.id);
 update public.mentor_slots set cancelled_at=coalesce(cancelled_at,now()) where mentor_id=old.id;
 update public.mentor_availability_rules set cancelled_at=coalesce(cancelled_at,now()) where mentor_id=old.id;
 delete from public.mentor_blackouts where mentor_id=old.id;
 update public.mentor_evidence set claim='Evidence awaiting retention removal',state=case when state='purged' then 'purged' else 'reviewed' end,retain_until=least(retain_until,now()) where mentor_id=old.id;
 update public.mentor_services set active=false,summary='Service no longer available',deliverables='Service no longer available' where mentor_id=old.id;
 update public.mentor_profiles set display_name='Former mentor',bio='',expertise=array['Unavailable'],languages=array['en'],countries='{}',degrees='{}',timezone='UTC',state='revoked',accepting=false,verified_summary='',decision_reason='',revision=revision+1,updated_at=now() where user_id=old.id;
 insert into public.mentor_events(request_id,subject_id,actor_id,kind)
 select id,student_id,old.id,'mentor_account_removed' from public.mentor_requests where mentor_id=old.id;
 return old;
end;
$$;
revoke all on function jetu_private.mentor_auth_removed() from public,anon,authenticated,service_role;
create trigger jetu_mentor_auth_removed before delete on auth.users for each row execute function jetu_private.mentor_auth_removed();

-- Verify fresh database membership as well as the signed JWT. Deleting an Auth
-- identity does not by itself invalidate an already-issued access token.
alter function public.mentor_command(jsonb) rename to mentor_extended_command;
alter function public.mentor_extended_command(jsonb) set schema jetu_private;
revoke all on function jetu_private.mentor_extended_command(jsonb) from public,anon,authenticated;
create function public.mentor_command(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 return jetu_private.mentor_extended_command(p_input);
end;
$$;
revoke all on function public.mentor_command(jsonb) from public,anon;
grant execute on function public.mentor_command(jsonb) to authenticated;

create or replace function public.mentor_resource(p_grant uuid,p_operation text default 'view') returns jsonb
language plpgsql security definer set search_path='' as $$
declare g public.mentor_resource_grants; r public.mentor_requests; result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(220022);
 select * into g from public.mentor_resource_grants where id=p_grant;
 select * into r from public.mentor_requests where id=g.request_id;
 if r.id is null or g.student_id<>r.student_id or g.mentor_id<>r.mentor_id or (r.student_id<>auth.uid() and not jetu_private.mentor_active(r.id)) or g.revoked_at is not null or g.expires_at<=now() or r.revoked_at is not null or r.expires_at<=now() or p_operation is null or p_operation not in ('view','download') or not p_operation=any(g.operations) then raise insufficient_privilege; end if;
 if g.resource_type='writing' and p_operation='view' then
   select jsonb_build_object('type','writing','title',v.snapshot->>'title','content',v.snapshot->>'content','prompt',v.snapshot->>'prompt','wordLimit',v.snapshot->'word_limit','version',v.version,'draft',v.draft_id) into result from public.writing_versions v join public.writing_drafts d on d.id=v.draft_id where v.id=g.version_id and v.user_id=r.student_id and not coalesce((d.studio->>'archived')::boolean,false);
 elsif g.resource_type='application' and p_operation='view' then
   if exists(select 1 from public.applications where id=g.resource_id and user_id=r.student_id and archived_at is null) then result:=jsonb_build_object('type','application','snapshot',g.snapshot); end if;
 elsif g.resource_type='vault' then
   select jsonb_build_object('type','vault','path',v.object_path,'mime',v.mime,'size',v.byte_size,'sha256',v.sha256,'version',v.id) into result from public.vault_versions v join public.vault_documents d on d.id=v.document_id where v.id=g.version_id and v.document_id=g.resource_id and v.user_id=r.student_id and v.state='available' and v.scanned_at is not null and d.category in ('cv','essay','transcript','certificate','language_test') and d.sensitivity not in ('restricted','confidential') and d.deleted_at is null and d.archived_at is null and d.expires_at>now();
 end if;
 if result is null then raise insufficient_privilege; end if;
 insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(r.id,r.student_id,auth.uid(),'resource_'||p_operation,jsonb_build_object('grant',g.id));
 return result;
end;
$$;
revoke all on function public.mentor_resource(uuid,text) from public,anon;
grant execute on function public.mentor_resource(uuid,text) to authenticated;


create or replace function public.mentor_evidence_access(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e public.mentor_evidence;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 select * into e from public.mentor_evidence where id=p_id and retain_until>now() and state in ('submitted','reviewed');
 if e.id is null or (e.mentor_id<>auth.uid() and not jetu_private.mentor_staff_role('verifier')) then raise insufficient_privilege; end if;
 insert into public.mentor_events(subject_id,actor_id,kind,details) values(e.mentor_id,auth.uid(),'evidence_read',jsonb_build_object('evidence',e.id));
 return jsonb_build_object('path',e.object_path,'mime',e.mime,'size',e.byte_size);
end;
$$;
revoke all on function public.mentor_evidence_access(uuid) from public,anon;
grant execute on function public.mentor_evidence_access(uuid) to authenticated;


create or replace function public.mentor_actor() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',auth.uid(),'verifier',jetu_private.mentor_staff_role('verifier'),'moderator',jetu_private.mentor_staff_role('moderator')) where auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid()) and not jetu_private.is_account_deletion_pending();
$$;
revoke all on function public.mentor_actor() from public,anon;
grant execute on function public.mentor_actor() to authenticated;

commit;
