-- Phase 22 follow-up: weekly availability, blackout exceptions and retention worker contract.
begin;
alter table public.mentor_requests add column pause_started_at timestamptz, add column paused_seconds bigint not null default 0 check(paused_seconds>=0), add column followup_rounds integer not null default 0 check(followup_rounds between 0 and 2);
alter table public.mentor_reports add column comment_id uuid references public.mentor_comments(id) on delete set null;
create index mentor_report_comment on public.mentor_reports(comment_id);
create table public.mentor_availability_rules (
 id uuid primary key default gen_random_uuid(),
 mentor_id uuid not null references public.mentor_profiles(user_id) on delete cascade,
 first_date date not null,
 start_time time not null,
 end_time time not null,
 timezone text not null,
 weeks integer not null check(weeks between 1 and 12),
 idempotency_key uuid not null,
 payload_hash text not null,
 cancelled_at timestamptz,
 created_at timestamptz not null default now(),
 unique(mentor_id,idempotency_key),
 check(end_time>start_time)
);
create table public.mentor_blackouts (
 id uuid primary key default gen_random_uuid(),
 mentor_id uuid not null references public.mentor_profiles(user_id) on delete cascade,
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 created_at timestamptz not null default now(),
 unique(mentor_id,starts_at,ends_at),
 check(ends_at>starts_at and ends_at<=starts_at+interval '30 days')
);
alter table public.mentor_slots add column rule_id uuid references public.mentor_availability_rules(id);
create index mentor_slot_rule on public.mentor_slots(rule_id);
create index mentor_rules_owner on public.mentor_availability_rules(mentor_id,first_date);
create index mentor_blackouts_owner on public.mentor_blackouts(mentor_id,starts_at);
alter table public.mentor_availability_rules enable row level security;
alter table public.mentor_blackouts enable row level security;
revoke all on public.mentor_availability_rules,public.mentor_blackouts from anon,authenticated;
grant select on public.mentor_availability_rules,public.mentor_blackouts to authenticated;
grant all on public.mentor_availability_rules,public.mentor_blackouts to service_role;
create policy mentor_rules_owner on public.mentor_availability_rules for select to authenticated using(mentor_id=(select auth.uid()) and not jetu_private.is_account_deletion_pending());
create policy mentor_blackouts_owner on public.mentor_blackouts for select to authenticated using(mentor_id=(select auth.uid()) and not jetu_private.is_account_deletion_pending());

-- Reject ambiguous and nonexistent wall times instead of silently moving a session
-- across a DST transition. Explicit-offset single slots remain available.
create function jetu_private.mentor_local_instant(p_date date,p_time time,p_zone text) returns timestamptz
language plpgsql stable security invoker set search_path='' as $$
declare local_time timestamp:=p_date+p_time; instant timestamptz;
begin
 if not exists(select 1 from pg_timezone_names where name=p_zone) then raise check_violation; end if;
 instant:=local_time at time zone p_zone;
 if instant at time zone p_zone<>local_time or exists(select 1 from generate_series(-8,8) n where n<>0 and (instant+make_interval(mins=>n*15)) at time zone p_zone=local_time) then
   raise exception using errcode='23514',message='ambiguous or nonexistent local time; choose an explicit offset slot';
 end if;
 return instant;
end;
$$;
revoke all on function jetu_private.mentor_local_instant(date,time,text) from public,anon,authenticated;
create function jetu_private.mentor_slot_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(220022);
 if new.cancelled_at is null and (exists(select 1 from public.mentor_blackouts b where b.mentor_id=new.mentor_id and b.starts_at<new.ends_at and b.ends_at>new.starts_at)
 or exists(select 1 from public.mentor_slots s where s.mentor_id=new.mentor_id and s.id<>new.id and s.cancelled_at is null and s.starts_at<new.ends_at and s.ends_at>new.starts_at)) then raise check_violation; end if;
 return new;
end;
$$;
create trigger mentor_slot_guard before insert or update on public.mentor_slots for each row execute function jetu_private.mentor_slot_guard();
revoke all on function jetu_private.mentor_slot_guard() from public,anon,authenticated;

-- Keep the already-tested core command private; the new wrapper adds only the
-- availability lifecycle. Both use the same transaction lock and Auth identity.
alter function public.mentor_command(jsonb) set schema jetu_private;
revoke all on function jetu_private.mentor_command(jsonb) from public,anon,authenticated;
create function public.mentor_command(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); op text:=p_input->>'op'; m public.mentor_profiles;
 r public.mentor_availability_rules; sid uuid; t0 timestamptz; t1 timestamptz;
 first_day date; start_wall time; end_wall time; n integer; fingerprint text;
 previous public.mentor_requests; result jsonb; elapsed bigint; grant_id uuid; reported public.mentor_reports; review_item jsonb;
begin
 if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 if jsonb_typeof(p_input)<>'object' or octet_length(p_input::text)>60000 then raise check_violation; end if;
 if op='evidence_submit' and not exists(select 1 from public.mentor_profiles where user_id=u and state in ('draft','needs_info','rejected')) then raise insufficient_privilege; end if;
 if op='report' then
   perform pg_advisory_xact_lock(220022);
   select * into previous from public.mentor_requests where id=(p_input->>'request')::uuid and student_id=u;
   if previous.id is null then raise insufficient_privilege; end if;
   if (select count(*) from public.mentor_reports where reporter_id=u and created_at>now()-interval '1 day')>=5 then raise exception using errcode='P0001',message='quota'; end if;
   if p_input->>'comment' is not null and not exists(select 1 from public.mentor_comments where id=(p_input->>'comment')::uuid and request_id=previous.id) then raise insufficient_privilege; end if;
   insert into public.mentor_reports(request_id,reporter_id,reason,explanation,comment_id) values(previous.id,u,p_input->>'reason',coalesce(p_input->>'explanation',''),(p_input->>'comment')::uuid) returning * into reported;
   insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(previous.id,u,u,'report',jsonb_build_object('case',reported.id));
   return jsonb_build_object('id',reported.id);
 end if;
 if op='case_suspend' then
   if not jetu_private.mentor_staff_role('moderator') or not coalesce((p_input->>'attest')::boolean,false) or length(btrim(p_input->>'reason'))<10 then raise insufficient_privilege; end if;
   perform pg_advisory_xact_lock(220022);
   select * into reported from public.mentor_reports where id=(p_input->>'case')::uuid;
   select * into previous from public.mentor_requests where id=reported.request_id;
   if previous.id is null or previous.mentor_id=u then raise insufficient_privilege; end if;
   update public.mentor_profiles set state='suspended',accepting=false,decision_reason=p_input->>'reason',revision=revision+1,updated_at=now() where user_id=previous.mentor_id and state='verified';
   update public.mentor_requests set revoked_at=coalesce(revoked_at,now()),revision=revision+1 where mentor_id=previous.mentor_id;
   update public.mentor_resource_grants set revoked_at=coalesce(revoked_at,now()) where mentor_id=previous.mentor_id;
   update public.mentor_bookings set state='cancelled' where request_id in(select id from public.mentor_requests where mentor_id=previous.mentor_id);
   insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(previous.id,previous.student_id,u,'moderation_suspension',jsonb_build_object('case',reported.id,'reason',p_input->>'reason'));
   return '{}';
 end if;
 -- Expired/purged proof requires a fresh evidence cycle before reinstatement.
 if op='verify' and p_input->>'state'='needs_info' then
   perform pg_advisory_xact_lock(220022);
   select * into m from public.mentor_profiles where user_id=(p_input->>'mentor')::uuid;
   if m.state='suspended' then
     if not jetu_private.mentor_staff_role('verifier') or m.user_id=u or length(btrim(p_input->>'reason'))<10 or not coalesce((p_input->>'attest')::boolean,false) then raise insufficient_privilege; end if;
     if m.revision<>(p_input->>'revision')::int then raise exception using errcode='40001',message='conflict'; end if;
     update public.mentor_profiles set state='needs_info',accepting=false,decision_reason=p_input->>'reason',reviewed_by=u,reviewed_at=now(),revision=revision+1,updated_at=now() where user_id=m.user_id;
     insert into public.mentor_events(subject_id,actor_id,kind,details) values(m.user_id,u,'verification',jsonb_build_object('from','suspended','to','needs_info','reason',p_input->>'reason'));
     return '{}';
   end if;
 end if;
 if op in ('transition','review') then
   perform pg_advisory_xact_lock(220022);
   select * into previous from public.mentor_requests where id=(p_input->>'request')::uuid for update;
   if op='transition' and previous.status='review_delivered' and previous.student_id=u and p_input->>'state'='needs_student_action' then raise check_violation; end if;
   if op='transition' and p_input->>'state'='in_review' and previous.status='review_delivered' and previous.student_id=u then
     if previous.revision<>(p_input->>'revision')::int then raise exception using errcode='40001',message='conflict'; end if;
     if previous.revoked_at is not null or previous.expires_at<=now() or previous.followup_rounds>=2 or not exists(select 1 from public.mentor_profiles where user_id=previous.mentor_id and state='verified') or not exists(select 1 from public.mentor_student_clearances where student_id=u and approved_until>now()) or exists(select 1 from public.mentor_blocks where student_id=u and mentor_id=previous.mentor_id) then raise insufficient_privilege; end if;
     for grant_id in select id from public.mentor_resource_grants where request_id=previous.id loop perform public.mentor_resource(grant_id,'view'); end loop;
     update public.mentor_requests set status='in_review',followup_rounds=followup_rounds+1,due_at=now()+make_interval(hours=>(terms_snapshot->>'turnaround_hours')::int),revision=revision+1,updated_at=now() where id=previous.id;
     insert into public.mentor_events(request_id,subject_id,actor_id,kind) values(previous.id,u,u,'followup_requested');
     return '{}';
   end if;
   if op='review' then
     for review_item in select jsonb_array_elements(p_input->'actions') loop
       if review_item->>'source' is not null and not exists(select 1 from public.mentor_resource_grants g where g.request_id=previous.id and g.resource_type='application' and g.revoked_at is null and g.expires_at>now() and g.snapshot->>'source'=review_item->>'source') then raise check_violation; end if;
     end loop;
   end if;
   result:=jetu_private.mentor_command(p_input);
   if op='transition' and p_input->>'state'='needs_student_action' then
     update public.mentor_requests set pause_started_at=coalesce(pause_started_at,now()) where id=previous.id;
   elsif previous.pause_started_at is not null and ((op='transition' and p_input->>'state'='in_review') or op='review') then
     elapsed:=greatest(0,floor(extract(epoch from now()-previous.pause_started_at)))::bigint;
     update public.mentor_requests set paused_seconds=paused_seconds+elapsed,due_at=due_at+make_interval(secs=>elapsed::double precision),pause_started_at=null where id=previous.id;
     insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(previous.id,previous.student_id,u,'sla_resumed',jsonb_build_object('pausedSeconds',elapsed));
   end if;
   return result;
 end if;
 if op not in ('weekly_slots','blackout','remove_blackout','cancel_slot','cancel_rule') then return jetu_private.mentor_command(p_input); end if;
 perform pg_advisory_xact_lock(220022);
 select * into m from public.mentor_profiles where user_id=u and state='verified' for update;
 if m.user_id is null then raise insufficient_privilege; end if;
 if op='weekly_slots' then
   fingerprint:=encode(extensions.digest((p_input-'key')::text,'sha256'),'hex');
   select * into r from public.mentor_availability_rules where mentor_id=u and idempotency_key=(p_input->>'key')::uuid;
   if found then
     if fingerprint<>r.payload_hash then raise check_violation; end if;
     return jsonb_build_object('id',r.id);
   end if;
   first_day:=(p_input->>'firstDate')::date; start_wall:=(p_input->>'startTime')::time; end_wall:=(p_input->>'endTime')::time; n:=(p_input->>'weeks')::int;
   if first_day is null or n is null or n not between 1 and 12 or end_wall is null or start_wall is null or end_wall<=start_wall or first_day+7*(n-1)>current_date+90 then raise check_violation; end if;
   if (select count(*) from public.mentor_availability_rules where mentor_id=u and created_at>now()-interval '1 day')>=12 then raise exception using errcode='P0001',message='availability quota'; end if;
   insert into public.mentor_availability_rules(mentor_id,first_date,start_time,end_time,timezone,weeks,idempotency_key,payload_hash)
   values(u,first_day,start_wall,end_wall,m.timezone,n,(p_input->>'key')::uuid,fingerprint) returning * into r;
   for n in 0..r.weeks-1 loop
     t0:=jetu_private.mentor_local_instant(first_day+7*n,start_wall,m.timezone);
     t1:=jetu_private.mentor_local_instant(first_day+7*n,end_wall,m.timezone);
     if t0<=now() then raise check_violation; end if;
     insert into public.mentor_slots(mentor_id,starts_at,ends_at,timezone,rule_id) values(u,t0,t1,m.timezone,r.id);
   end loop;
   sid:=r.id;
 elsif op='blackout' then
   t0:=(p_input->>'start')::timestamptz;t1:=(p_input->>'end')::timestamptz;
   if t0 is null or t1 is null or t1<=now() or t0>now()+interval '90 days' then raise check_violation; end if;
   insert into public.mentor_blackouts(mentor_id,starts_at,ends_at) values(u,t0,t1)
   on conflict(mentor_id,starts_at,ends_at) do update set starts_at=excluded.starts_at returning id into sid;
   update public.mentor_slots set cancelled_at=coalesce(cancelled_at,now()) where mentor_id=u and starts_at<t1 and ends_at>t0;
   update public.mentor_bookings set state='cancelled' where slot_id in(select id from public.mentor_slots where mentor_id=u and starts_at<t1 and ends_at>t0);
 elsif op='remove_blackout' then
   delete from public.mentor_blackouts where id=(p_input->>'id')::uuid and mentor_id=u returning id into sid;
   if not found then raise insufficient_privilege; end if;
 elsif op='cancel_slot' then
   update public.mentor_slots set cancelled_at=coalesce(cancelled_at,now()) where id=(p_input->>'id')::uuid and mentor_id=u returning id into sid;
   if not found then raise insufficient_privilege; end if;
   update public.mentor_bookings set state='cancelled' where slot_id=sid;
 elsif op='cancel_rule' then
   update public.mentor_availability_rules set cancelled_at=coalesce(cancelled_at,now()) where id=(p_input->>'id')::uuid and mentor_id=u returning id into sid;
   if not found then raise insufficient_privilege; end if;
   update public.mentor_slots set cancelled_at=coalesce(cancelled_at,now()) where rule_id=sid and starts_at>now();
   update public.mentor_bookings set state='cancelled' where slot_id in(select id from public.mentor_slots where rule_id=sid and starts_at>now());
 end if;
 insert into public.mentor_events(subject_id,actor_id,kind,details) values(u,u,op,jsonb_build_object('id',sid));
 return jsonb_build_object('id',sid);
end;
$$;
revoke all on function public.mentor_command(jsonb) from public,anon;
grant execute on function public.mentor_command(jsonb) to authenticated;

-- Moderator reads only the specific comment referenced by an existing case.
create function public.mentor_case_context(p_case uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.mentor_reports; result jsonb;
begin
 if auth.uid() is null or not jetu_private.mentor_staff_role('moderator') then raise insufficient_privilege; end if;
 select * into r from public.mentor_reports where id=p_case;
 if r.id is null then raise insufficient_privilege; end if;
 select jsonb_build_object('author',c.author_id,'body',c.body,'createdAt',c.created_at,'quote',c.anchor->>'quote') into result from public.mentor_comments c where c.id=r.comment_id and c.request_id=r.request_id;
 insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(r.request_id,r.reporter_id,auth.uid(),'moderation_context_read',jsonb_build_object('case',r.id));
 return coalesce(result,'{}'::jsonb);
end;
$$;
revoke all on function public.mentor_case_context(uuid) from public,anon;
grant execute on function public.mentor_case_context(uuid) to authenticated;

-- Service-only retention worker. Claim metadata is redacted only after Storage
-- confirms deletion; scheduling this worker remains an operator responsibility.
create function public.mentor_retention_candidates() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'path',e.object_path)),'[]'::jsonb)
 from (select id,object_path from public.mentor_evidence where retain_until<=now() and state<>'purged' order by retain_until limit 50) e;
$$;
create function public.mentor_retention_finish(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from storage.objects o join public.mentor_evidence e on e.object_path=o.name and o.bucket_id='mentor-evidence' where e.id=p_id) then raise check_violation; end if;
 update public.mentor_evidence set state='purged',claim='Evidence removed under retention policy' where id=p_id and retain_until<=now();
 delete from public.mentor_request_drafts where updated_at<now()-interval '30 days';
end;
$$;
revoke all on function public.mentor_retention_candidates(),public.mentor_retention_finish(uuid) from public,anon,authenticated;
grant execute on function public.mentor_retention_candidates(),public.mentor_retention_finish(uuid) to service_role;
commit;
