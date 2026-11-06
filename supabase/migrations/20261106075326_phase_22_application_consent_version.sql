-- An application has a mutable CAS version. Consent must not silently capture a
-- newer application row than the student selected and previewed.
begin;
create or replace function public.mentor_command(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); item jsonb; actual_version bigint;
begin
 if u is null or not exists(select 1 from auth.users where id=u) or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 if jsonb_typeof(p_input) is distinct from 'object' or octet_length(p_input::text)>60000 then raise check_violation; end if;
 if p_input->>'op'='create' then
   if jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items')>10 then raise check_violation; end if;
   perform pg_advisory_xact_lock(220022);
   -- An uncertain retry acknowledges the original immutable receipt even if the
   -- student's application has since changed. The core rechecks its payload digest.
   if not exists(select 1 from public.mentor_requests where student_id=u and idempotency_key=(p_input->>'key')::uuid) then
     for item in select jsonb_array_elements(p_input->'items') loop
       if item->>'type'='application' then
         select version into actual_version from public.applications where id=(item->>'resource')::uuid and user_id=u and archived_at is null for share;
         if not found then raise insufficient_privilege; end if;
         if item->>'expectedVersion' is null or actual_version<>(item->>'expectedVersion')::bigint then raise exception using errcode='40001',message='application version changed; review consent again'; end if;
       end if;
     end loop;
   end if;
 end if;
 return jetu_private.mentor_extended_command(p_input);
end;
$$;
revoke all on function public.mentor_command(jsonb) from public,anon;
grant execute on function public.mentor_command(jsonb) to authenticated;
-- Participants retain their own booking time even though booked slots disappear
-- from the public directory. Other students cannot inspect these event details.
create function public.mentor_bookings_view() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'request_id',q.request_id,'slot_id',q.slot_id,'state',q.state,'starts_at',q.starts_at,'ends_at',q.ends_at,'timezone',q.timezone) order by q.starts_at),'[]'::jsonb)
 from (select b.id,b.request_id,b.slot_id,b.state,s.starts_at,s.ends_at,s.timezone from public.mentor_bookings b join public.mentor_slots s on s.id=b.slot_id
 where auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid()) and jetu_private.mentor_participant(b.request_id) order by b.created_at desc limit 100) q;
$$;
revoke all on function public.mentor_bookings_view() from public,anon;
grant execute on function public.mentor_bookings_view() to authenticated;
-- Limited operational counts disclose no student content or identities.
create index mentor_verification_queue on public.mentor_profiles(state,created_at);
create or replace function public.mentor_actor() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',auth.uid(),'verifier',jetu_private.mentor_staff_role('verifier'),'moderator',jetu_private.mentor_staff_role('moderator'),'stats',
 (case when jetu_private.mentor_staff_role('verifier') then jsonb_build_object('verificationPending',(select count(*) from public.mentor_profiles where state='submitted')) else '{}'::jsonb end)||
 (case when jetu_private.mentor_staff_role('moderator') then jsonb_build_object('reportsPending',(select count(*) from public.mentor_reports where status in ('new','triaged','investigating','appealed')),'overdueRequests',(select count(*) from public.mentor_requests where revoked_at is null and expires_at>now() and due_at<now() and pause_started_at is null and status in ('submitted','accepted','in_review')),'expiredConsents',(select count(*) from public.mentor_requests where revoked_at is null and expires_at<=now() and status not in ('completed','cancelled'))) else '{}'::jsonb end))
 where auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid()) and not jetu_private.is_account_deletion_pending();
$$;
revoke all on function public.mentor_actor() from public,anon;
grant execute on function public.mentor_actor() to authenticated;
commit;
