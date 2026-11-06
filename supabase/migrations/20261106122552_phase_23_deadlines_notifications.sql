-- Phase 23: canonical source projections and durable, in-app-only delivery.
-- No external messages, no historical backfill, no competing official deadline table.
begin;
create table public.calendar_custom_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check(length(btrim(title)) between 1 and 240),
  due_date date not null check(due_date between date '2000-01-01' and date '2200-12-31'),
  status text not null default 'active' check(status in ('active','completed','canceled')),
  version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index calendar_custom_owner_date on public.calendar_custom_events(user_id,due_date,id);
create table public.deadline_watches (
  user_id uuid not null references auth.users(id) on delete cascade,
  deadline_id bigint not null references public.deadlines(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,deadline_id)
);
create index deadline_watches_deadline on public.deadline_watches(deadline_id);
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  in_app boolean not null default true, paused boolean not null default false,
  categories text[] not null default array['application','scholarship','roadmap','custom']::text[]
    check(categories <@ array['application','scholarship','roadmap','custom']::text[] and cardinality(categories)<=4),
  source_changes boolean not null default true,
  lead_days integer[] not null default array[30,14,7,1] check(cardinality(lead_days) between 1 and 8 and 0<=all(lead_days) and 90>=all(lead_days)),
  digest text not null default 'immediate' check(digest in ('immediate','daily','weekly','off')),
  digest_time time not null default '09:00', quiet_start time not null default '22:00', quiet_end time not null default '08:00',
  updated_at timestamptz not null default now()
);
create table public.notification_event_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null check(length(event_key) between 1 and 120),
  muted boolean not null default false, primary key(user_id,event_key)
);
create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null, revision text not null, kind text not null check(kind in ('reminder','source_change')),
  lead_days integer not null, channel text not null default 'in_app' check(channel='in_app'),
  planned_at timestamptz not null, status text not null default 'queued' check(status in ('queued','sent','canceled','failed')),
  attempts integer not null default 0, last_error_code text, sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id,event_key,revision,kind,lead_days,channel)
);
create index notification_jobs_due on public.notification_jobs(planned_at,id) where status='queued';
create index notification_jobs_owner on public.notification_jobs(user_id,event_key);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), job_id uuid not null unique references public.notification_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null, title text not null, category text not null, kind text not null,
  due_date date, due_at timestamptz, previous_due_date date, previous_due_at timestamptz, lead_days integer not null,
  created_at timestamptz not null default now(), read_at timestamptz, archived_at timestamptz
);
create index notifications_owner_recent on public.notifications(user_id,created_at desc,id);
create index notifications_owner_unread on public.notifications(user_id) where read_at is null and archived_at is null;
create table public.notification_preference_audit (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade,
  settings jsonb not null, created_at timestamptz not null default now()
);
create index notification_preference_audit_owner on public.notification_preference_audit(user_id,created_at desc);
create table public.notification_worker_runs (
  id bigint generated always as identity primary key, started_at timestamptz not null default now(),
  finished_at timestamptz, queued integer not null default 0, sent integer not null default 0, failed integer not null default 0
);

-- All exposed tables have RLS. Only preferences/personal events/watches/mutes permit writes.
do $$ declare t text; begin
  foreach t in array array['calendar_custom_events','deadline_watches','notification_preferences','notification_event_settings','notification_jobs','notifications','notification_preference_audit','notification_worker_runs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    if t <> 'notification_worker_runs' then
      execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
      execute format('grant select on public.%I to authenticated',t);
    end if;
  end loop;
  foreach t in array array['calendar_custom_events','notification_preferences','notification_event_settings'] loop
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
  end loop;
end $$;
create policy watch_insert on public.deadline_watches for insert to authenticated with check (
 (select auth.uid())=user_id and exists(select 1 from public.deadlines d where d.id=deadline_id)
);
create policy watch_delete on public.deadline_watches for delete to authenticated using ((select auth.uid())=user_id);
grant insert,delete on public.deadline_watches to authenticated;
grant insert(user_id,title,due_date,status),update(title,due_date,status) on public.calendar_custom_events to authenticated;
grant insert(user_id,timezone,in_app,paused,categories,source_changes,lead_days,digest,digest_time,quiet_start,quiet_end),
 update(timezone,in_app,paused,categories,source_changes,lead_days,digest,digest_time,quiet_start,quiet_end) on public.notification_preferences to authenticated;
grant insert,update on public.notification_event_settings to authenticated;
create policy notification_receipt_update on public.notifications for update to authenticated
 using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
grant update(read_at,archived_at) on public.notifications to authenticated;
grant usage,select on sequence public.notification_preference_audit_id_seq,public.notification_worker_runs_id_seq to service_role;

create function public.calendar_event_limit() returns trigger language plpgsql set search_path='' as $$
begin
 if auth.uid() is not null and auth.uid()<>new.user_id then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,230));
 if (select count(*) from public.calendar_custom_events where user_id=new.user_id)>=500 then
  raise exception 'Personal date limit reached' using errcode='54000';
 end if;
 return new;
end $$;
create trigger calendar_event_limit before insert on public.calendar_custom_events for each row execute function public.calendar_event_limit();
create function public.calendar_touch() returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at:=clock_timestamp();
  new.version:=old.version+1;
  return new;
end $$;
create trigger calendar_custom_touch before update on public.calendar_custom_events for each row execute function public.calendar_touch();
create function public.notification_check_timezone() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) or new.timezone ~ '^[+-]' then
   raise exception 'Invalid IANA timezone' using errcode='22023';
 end if;
 new.updated_at:=clock_timestamp(); return new;
end $$;
create trigger notification_timezone before insert or update on public.notification_preferences for each row execute function public.notification_check_timezone();

-- Official sources stay canonical in deadlines. A watch is an explicit opt-in.
-- Derived tasks do not turn editable snapshots into verified official dates.
create view public.calendar_deadline_subscriptions with(security_invoker=true) as
select user_id,deadline_id from public.deadline_watches
union
select s.user_id,rd.deadline_id from public.saved_catalog_items s
 join public.catalog_entities target on target.id=s.catalog_entity_id
 join public.admission_intakes i on i.program_id=s.catalog_entity_id
 join public.application_rounds r on r.intake_id=i.id
 join public.application_round_deadlines rd on rd.application_round_id=r.id
 where target.publication_status_code='published' and target.verification_state_code='verified' and target.archived_at is null
union
select s.user_id,cd.deadline_id from public.saved_catalog_items s
 join public.catalog_entities target on target.id=s.catalog_entity_id
 join public.scholarship_cycles c on c.scholarship_id=s.catalog_entity_id
 join public.scholarship_cycle_deadlines cd on cd.scholarship_cycle_id=c.id
 where target.publication_status_code='published' and target.verification_state_code='verified' and target.archived_at is null
union
select s.user_id,od.deadline_id from public.saved_catalog_items s
 join public.catalog_entities target on target.id=s.catalog_entity_id
 join public.opportunity_deadlines od on od.opportunity_id=s.catalog_entity_id
 where target.publication_status_code='published' and target.verification_state_code='verified' and target.archived_at is null
union
select a.user_id,rd.deadline_id from public.applications a
 join public.application_rounds r on r.intake_id=a.intake_id
 join public.application_round_deadlines rd on rd.application_round_id=r.id
 where a.archived_at is null and a.status not in ('withdrawn','rejected','declined','enrollment')
union
select a.user_id,cd.deadline_id from public.scholarship_applications a
 join public.scholarship_cycle_deadlines cd on cd.scholarship_cycle_id=a.scholarship_cycle_id
 where a.status not in ('withdrawn','not_awarded');
revoke all on public.calendar_deadline_subscriptions from public,anon;
grant select on public.calendar_deadline_subscriptions to authenticated,service_role;
create view public.calendar_events with(security_invoker=true) as
select 'custom:'||e.id::text event_key,e.user_id,e.title,'custom'::text category,'user_created'::text origin,
 'date_only'::text as "precision",null::timestamptz due_at,e.due_date,null::text timezone,null::text source_url,
 null::timestamptz checked_at,false verified,e.status,
 md5(e.due_date::text||e.status) revision,e.version,e.updated_at,coalesce(s.muted,false) muted
from public.calendar_custom_events e left join public.notification_event_settings s on s.user_id=e.user_id and s.event_key='custom:'||e.id::text
union all
select 'official:'||d.id::text,w.user_id,d.title,
 case when d.deadline_type in ('scholarship','financial_aid') then 'scholarship' else 'application' end,'official',
 d.date_precision,d.due_at,d.due_date,d.timezone_name,src.url,ce.last_checked_at,
 ce.publication_status_code='published' and ce.verification_state_code='verified' and ce.archived_at is null
   and ce.last_checked_at is not null and (ce.effective_until is null or ce.effective_until>=current_date)
   and (ce.effective_from is null or ce.effective_from<=current_date) and src.url is not null,
 case when ce.archived_at is not null then 'canceled' else 'active' end,
 md5(coalesce(d.due_at::text,'')||coalesce(d.due_date::text,'')||d.date_precision||coalesce(d.timezone_name,'')||ce.verification_state_code||coalesce(ce.archived_at::text,'')),
 least(ce.revision,2147483647)::integer,ce.updated_at,coalesce(s.muted,false)
from public.calendar_deadline_subscriptions w join public.deadlines d on d.id=w.deadline_id join public.catalog_entities ce on ce.id=d.id
left join lateral (
 select os.canonical_url as url from public.source_claims sc join public.official_sources os on os.id=sc.source_id
 where sc.catalog_entity_id=d.id and sc.verification_state_code='verified'
 and os.is_active and (os.effective_until is null or os.effective_until>=current_date) and (os.effective_from is null or os.effective_from<=current_date)
 and sc.claim_key='deadline' and (sc.effective_until is null or sc.effective_until>=current_date)
 order by sc.observed_at desc,sc.id desc limit 1
) src on true
left join public.notification_event_settings s on s.user_id=w.user_id and s.event_key='official:'||d.id::text
union all
select 'roadmap:'||r.id::text,r.user_id,r.title,'roadmap','derived','date_only',null::timestamptz,
 coalesce(r.target_date,r.recommended_due_date),null::text,r.official_source_url,r.official_source_checked_at,false,
 case when r.obsolete_at is not null then 'superseded' when r.status='completed' then 'completed' else 'active' end,
 md5(coalesce(r.target_date::text,r.recommended_due_date::text,'')||r.status||coalesce(r.obsolete_at::text,'')),
 least(r.version,2147483647)::integer,r.updated_at,coalesce(s.muted,false)
from public.roadmap_tasks r left join public.notification_event_settings s on s.user_id=r.user_id and s.event_key='roadmap:'||r.id::text
where coalesce(r.target_date,r.recommended_due_date) is not null;
revoke all on public.calendar_events from public,anon;
grant select on public.calendar_events to authenticated,service_role;

-- Pure functions have an explicit clock. PostgreSQL uses the later occurrence for
-- DST overlap and moves nonexistent local times forward; tests pin both policies.
create function public.notification_allowed_at(p_at timestamptz,p public.notification_preferences)
returns timestamptz language plpgsql stable set search_path='' as $$
declare v timestamp:=p_at at time zone p.timezone; d date; t time; begin
 if p.paused or not p.in_app or p.digest='off' then return null; end if;
 if p.digest<>'immediate' then
   d:=v::date;
   if p.digest='weekly' then d:=d+((8-extract(isodow from d)::int)%7); end if;
   if d+p.digest_time<v then d:=d+case when p.digest='weekly' then 7 else 1 end; end if;
   v:=d+p.digest_time;
 end if;
 t:=v::time;
 if p.quiet_start<>p.quiet_end and (
  (p.quiet_start<p.quiet_end and t>=p.quiet_start and t<p.quiet_end) or
  (p.quiet_start>p.quiet_end and (t>=p.quiet_start or t<p.quiet_end))
 ) then v:=v::date+p.quiet_end+case when p.quiet_start>p.quiet_end and t>=p.quiet_start then interval '1 day' else interval '0' end; end if;
 return v at time zone p.timezone;
end $$;

-- Private trigger cancels pending jobs immediately after a preference or source
-- edit. It never rewrites send history and never sends an external message.
create schema if not exists notification_private;
revoke all on schema notification_private from public,anon,authenticated;
create function notification_private.preferences_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notification_preference_audit(user_id,settings) values(new.user_id,to_jsonb(new)-'user_id');
 update public.notification_jobs set status='canceled' where user_id=new.user_id and status='queued';
 return new;
end $$;
create trigger notification_preferences_audit after insert or update on public.notification_preferences for each row execute function notification_private.preferences_changed();
create function notification_private.initialize_preferences() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notification_preferences(user_id) values(new.id) on conflict do nothing;
 return new;
end $$;
create trigger jetu_notification_preferences after insert on auth.users for each row execute function notification_private.initialize_preferences();
-- In-app defaults only; no external consent is created. Future reminders start
-- after this opt-in timestamp, excluding historical occurrences.
insert into public.notification_preferences(user_id) select id from auth.users on conflict do nothing;
create function notification_private.event_changed() returns trigger language plpgsql security definer set search_path='' as $$
declare k text; begin
 k:=case when tg_table_name='deadlines' then 'official:' else 'custom:' end||new.id::text;
 if tg_table_name='deadlines' then
   if (to_jsonb(new)-array['title']) is not distinct from (to_jsonb(old)-array['title']) then return new; end if;
 end if;
 update public.notification_jobs set status='canceled' where event_key=k and status='queued';
 return new;
end $$;
create trigger notification_deadline_change after update on public.deadlines for each row execute function notification_private.event_changed();
create trigger notification_custom_change after update on public.calendar_custom_events for each row execute function notification_private.event_changed();

-- One authorized scheduler, bounded queue scans, transactional claims and receipt
-- insertion. A crash rolls back both receipt and sent state. No provider fiction.
create function notification_private.run(p_now timestamptz default now(),p_limit integer default 200)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j record; e record; p public.notification_preferences; v_run bigint; v_sent int:=0; v_queued int:=0; v_failed int:=0; begin
 if p_limit<1 or p_limit>1000 then raise exception 'Invalid batch size'; end if;
 if not pg_try_advisory_xact_lock(2300611) then return jsonb_build_object('busy',true); end if;
 insert into public.notification_worker_runs(started_at) values(p_now) returning id into v_run;
 -- Absent source, withdrawn publication, changed revision or opt-out invalidates work.
 update public.notification_jobs q set status='canceled'
 where q.status='queued' and not exists(
 select 1 from public.calendar_events ce join public.notification_preferences pref on pref.user_id=ce.user_id
 where ce.user_id=q.user_id and ce.event_key=q.event_key and ce.revision=q.revision and ce.status='active'
 and not ce.muted and (ce.origin<>'official' or ce.verified) and pref.in_app and not pref.paused and pref.digest<>'off'
 and (case when q.kind='source_change' then pref.source_changes else ce.category=any(pref.categories) and q.lead_days=any(pref.lead_days) end));
 -- Reminder identity excludes preference revision, so pause/resume cannot repeat sent work.
 insert into public.notification_jobs(user_id,event_key,revision,kind,lead_days,planned_at)
 select ce.user_id,ce.event_key,ce.revision,'reminder',lead,
 public.notification_allowed_at(
   case when ce.precision='instant' then ((ce.due_at at time zone pref.timezone)-make_interval(days=>lead)) at time zone pref.timezone
   else (ce.due_date-lead+time '09:00') at time zone pref.timezone end,pref)
 from public.calendar_events ce join public.notification_preferences pref on pref.user_id=ce.user_id
 cross join lateral unnest(pref.lead_days) lead
 where ce.status='active' and not ce.muted and (ce.origin<>'official' or ce.verified)
 and ce.category=any(pref.categories) and pref.in_app and not pref.paused and pref.digest<>'off'
 and ce.precision in ('instant','date_only')
 and not exists(select 1 from public.notification_jobs done where done.user_id=ce.user_id and done.event_key=ce.event_key and done.revision=ce.revision and done.kind='reminder' and done.lead_days=lead and done.status<>'canceled')
 -- Do not backfill old reminders. Five-minute catch-up tolerates normal cron jitter.
 and (case when ce.precision='instant' then ((ce.due_at at time zone pref.timezone)-make_interval(days=>lead)) at time zone pref.timezone
   else (ce.due_date-lead+time '09:00') at time zone pref.timezone end)>=greatest(pref.updated_at,p_now-interval '5 minutes')
 and (case when ce.precision='instant' then ce.due_at>=p_now else ce.due_date>=(p_now at time zone pref.timezone)::date end)
 order by ce.user_id,ce.event_key,lead limit p_limit
 on conflict(user_id,event_key,revision,kind,lead_days,channel) do update
 set planned_at=excluded.planned_at,status='queued'
 where notification_jobs.status='canceled' and notification_jobs.sent_at is null;
 get diagnostics v_queued=row_count;
 -- A changed, verified revision gets one correction only if this user had a prior reminder.
 insert into public.notification_jobs(user_id,event_key,revision,kind,lead_days,planned_at)
 select ce.user_id,ce.event_key,ce.revision,'source_change',-1,public.notification_allowed_at(p_now,pref)
 from public.calendar_events ce join public.notification_preferences pref on pref.user_id=ce.user_id
 where ce.origin='official' and ce.verified and ce.status='active' and not ce.muted
 and pref.source_changes and pref.in_app and not pref.paused and pref.digest<>'off'
 and exists(select 1 from public.notification_jobs old where old.user_id=ce.user_id and old.event_key=ce.event_key and old.revision<>ce.revision and old.status='sent')
 order by ce.user_id,ce.event_key limit p_limit on conflict do nothing;
 for j in select * from public.notification_jobs where status='queued' and planned_at<=p_now order by planned_at,id for update skip locked limit p_limit loop
  begin
   select * into e from public.calendar_events where user_id=j.user_id and event_key=j.event_key;
   select * into p from public.notification_preferences where user_id=j.user_id for share;
   if e.event_key is null or e.revision<>j.revision or e.status<>'active' or e.muted
    or (e.origin='official' and not e.verified) or p.paused or not p.in_app or p.digest='off'
    or (j.kind='reminder' and not e.category=any(p.categories)) or (j.kind='source_change' and not p.source_changes)
    or (e.precision='instant' and e.due_at<p_now) or (e.precision='date_only' and e.due_date<(p_now at time zone p.timezone)::date) then
      update public.notification_jobs set status='canceled' where id=j.id; continue;
   end if;
   if public.notification_allowed_at(p_now,(jsonb_populate_record(p,'{"digest":"immediate"}'::jsonb)))>p_now then
     update public.notification_jobs set planned_at=public.notification_allowed_at(p_now,(jsonb_populate_record(p,'{"digest":"immediate"}'::jsonb))) where id=j.id; continue;
   end if;
   insert into public.notifications(job_id,user_id,event_key,title,category,kind,due_date,due_at,previous_due_date,previous_due_at,lead_days,created_at)
   values(j.id,j.user_id,j.event_key,e.title,e.category,j.kind,e.due_date,e.due_at,
    case when j.kind='source_change' then (select n.due_date from public.notifications n join public.notification_jobs prior on prior.id=n.job_id where n.user_id=j.user_id and n.event_key=j.event_key order by prior.created_at desc,prior.id limit 1) end,
    case when j.kind='source_change' then (select n.due_at from public.notifications n join public.notification_jobs prior on prior.id=n.job_id where n.user_id=j.user_id and n.event_key=j.event_key order by prior.created_at desc,prior.id limit 1) end,
    j.lead_days,p_now) on conflict(job_id) do nothing;
   update public.notification_jobs set status='sent',sent_at=p_now,attempts=attempts+1,last_error_code=null where id=j.id;
   v_sent:=v_sent+1;
  exception when others then
   update public.notification_jobs set attempts=attempts+1,status=case when attempts>=4 then 'failed' else 'queued' end,
    planned_at=p_now+make_interval(secs=>least(3600,(power(2,least(attempts,10))*30)::int)),last_error_code=sqlstate where id=j.id;
   v_failed:=v_failed+1;
  end;
 end loop;
 update public.notification_worker_runs set finished_at=clock_timestamp(),queued=v_queued,sent=v_sent,failed=v_failed where id=v_run;
 -- Operational metadata is bounded; inbox/history persists until owner deletion.
 delete from public.notification_worker_runs where started_at<p_now-interval '30 days';
 return jsonb_build_object('queued',v_queued,'sent',v_sent,'failed',v_failed);
end $$;
revoke all on function public.calendar_event_limit(),public.calendar_touch(),public.notification_check_timezone(),public.notification_allowed_at(timestamptz,public.notification_preferences) from public,anon,authenticated;
revoke all on all functions in schema notification_private from public,anon,authenticated;
grant usage on schema notification_private to service_role;
grant execute on all functions in schema notification_private to service_role;
grant execute on function public.notification_allowed_at(timestamptz,public.notification_preferences) to service_role;
-- Cron activation is separate and explicit per target. Migration itself schedules
-- nothing, preventing restored test/staging copies from dispatching automatically.
commit;
