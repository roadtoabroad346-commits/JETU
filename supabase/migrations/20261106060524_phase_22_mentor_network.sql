-- Phase 22: explicit human trust, exact-version consent and audited commands.
-- No human memberships, verified profiles or student approvals are seeded.
begin;
create table jetu_private.mentor_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check(role in ('verifier','moderator')),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table jetu_private.mentor_staff enable row level security;
create table public.mentor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check(length(btrim(display_name)) between 2 and 100),
  bio text not null check(length(bio)<=2000),
  expertise text[] not null check(cardinality(expertise) between 1 and 16),
  languages text[] not null check(cardinality(languages) between 1 and 6 and languages <@ array['ru','kk','en']),
  countries text[] not null default '{}',
  degrees text[] not null default '{}' check(degrees <@ array['bachelor','master','phd','school']),
  timezone text not null default 'Asia/Almaty',
  capacity integer not null default 3 check(capacity between 1 and 20),
  accepting boolean not null default false,
  state text not null default 'draft' check(state in ('draft','submitted','needs_info','verified','rejected','suspended','revoked')),
  verified_summary text not null default '' check(length(verified_summary)<=1000),
  decision_reason text not null default '' check(length(decision_reason)<=1000),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(state<>'verified' or (reviewed_by is not null and reviewed_by<>user_id and reviewed_at is not null and length(btrim(verified_summary))>=10))
);
create table public.mentor_evidence (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles(user_id) on delete cascade,
  claim text not null check(length(btrim(claim)) between 10 and 1000),
  object_path text not null unique,
  mime text not null check(mime in ('application/pdf','image/png','image/jpeg')),
  byte_size integer not null check(byte_size between 1 and 3145728),
  state text not null default 'reserved' check(state in ('reserved','submitted','reviewed','purged')),
  created_at timestamptz not null default now(),
  retain_until timestamptz not null default now()+interval '30 days',
  check(object_path=mentor_id::text||'/'||id::text)
);
create table public.mentor_services (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles(user_id) on delete cascade,
  kind text not null check(kind in ('essay','scholarship','sop','cv','shortlist','readiness','interview','documents','session')),
  summary text not null check(length(btrim(summary)) between 10 and 1000),
  deliverables text not null check(length(btrim(deliverables)) between 10 and 2000),
  turnaround_hours integer not null check(turnaround_hours between 1 and 720),
  price_minor integer not null default 0 check(price_minor between 0 and 100000000),
  currency text not null default 'KZT' check(currency in ('KZT','USD','EUR')),
  active boolean not null default true,
  unique(mentor_id,kind)
);
-- Clearance is operator-reviewed, never inferred from user-editable age/metadata.
create table public.mentor_student_clearances (
  student_id uuid primary key references auth.users(id) on delete cascade,
  approved_until timestamptz not null,
  guardian_required boolean not null,
  policy_version text not null default 'mentor-safety-v1',
  reviewed_by uuid not null references auth.users(id),
  reason text not null check(length(btrim(reason)) between 10 and 1000),
  updated_at timestamptz not null default now(),
  check(student_id<>reviewed_by)
);
create table public.mentor_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references public.mentor_profiles(user_id),
  service_id uuid not null references public.mentor_services(id),
  goal text not null check(length(btrim(goal)) between 10 and 2000),
  status text not null default 'submitted' check(status in ('submitted','accepted','in_review','needs_student_action','review_delivered','completed','cancelled','expired','disputed')),
  terms_snapshot jsonb not null,
  consent_version text not null default 'mentor-consent-v1',
  expires_at timestamptz not null,
  due_at timestamptz not null,
  revoked_at timestamptz,
  revision integer not null default 1,
  idempotency_key uuid not null,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id,idempotency_key),
  unique(id,student_id,mentor_id),
  check(student_id<>mentor_id),
  check(expires_at>created_at and expires_at<=created_at+interval '30 days')
);
create table public.mentor_request_drafts (
  student_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid not null references public.mentor_services(id) on delete cascade,
  goal text not null default '' check(length(goal)<=2000),
  items jsonb not null default '[]' check(jsonb_typeof(items)='array' and jsonb_array_length(items)<=10),
  consent_until timestamptz not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key(student_id,service_id)
);
create index mentor_drafts_service on public.mentor_request_drafts(service_id);
create table public.mentor_resource_grants (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mentor_requests(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references public.mentor_profiles(user_id),
  resource_type text not null check(resource_type in ('writing','vault','application')),
  resource_id uuid not null,
  version_id uuid not null,
  operations text[] not null default array['view','comment','review'] check(operations <@ array['view','comment','review','download'] and 'view'=any(operations)),
  snapshot jsonb,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  policy_version text not null default 'mentor-consent-v1',
  foreign key(request_id,student_id,mentor_id) references public.mentor_requests(id,student_id,mentor_id),
  unique(request_id,resource_type,version_id)
);
create table public.mentor_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mentor_requests(id) on delete cascade,
  grant_id uuid references public.mentor_resource_grants(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  parent_id uuid references public.mentor_comments(id),
  body text not null check(length(btrim(body)) between 1 and 2000),
  anchor jsonb,
  disposition text not null default 'suggested' check(disposition in ('suggested','resolved','rejected')),
  revision integer not null default 1,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique(author_id,idempotency_key)
);
create table public.mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mentor_requests(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  outcome text not null check(outcome in ('more_work_needed','ready_for_student_review','incomplete_information')),
  summary text not null check(length(btrim(summary)) between 10 and 4000),
  rubric jsonb not null,
  actions jsonb not null default '[]',
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique(author_id,idempotency_key)
);
create table public.mentor_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles(user_id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  cancelled_at timestamptz,
  check(ends_at>starts_at and ends_at<=starts_at+interval '2 hours'),
  unique(mentor_id,starts_at)
);
create table public.mentor_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.mentor_slots(id),
  request_id uuid not null references public.mentor_requests(id) on delete cascade,
  state text not null default 'confirmed_link_pending' check(state in ('confirmed_link_pending','cancelled')),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique(request_id,idempotency_key)
);
create unique index mentor_booking_one_active on public.mentor_bookings(slot_id) where state<>'cancelled';
create table public.mentor_blocks (
  student_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references public.mentor_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(student_id,mentor_id)
);
create table public.mentor_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mentor_requests(id) on delete cascade,
  reporter_id uuid not null references auth.users(id),
  reason text not null check(reason in ('contact','harassment','privacy','integrity','other')),
  explanation text not null default '' check(length(explanation)<=2000),
  status text not null default 'new' check(status in ('new','triaged','investigating','actioned','closed','appealed')),
  resolution text not null default '' check(length(resolution)<=1000),
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.mentor_events (
  id bigint generated always as identity primary key,
  request_id uuid references public.mentor_requests(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  kind text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index mentor_evidence_owner on public.mentor_evidence(mentor_id);
create index mentor_services_owner on public.mentor_services(mentor_id,active);
create index mentor_requests_student on public.mentor_requests(student_id,created_at desc);
create index mentor_requests_queue on public.mentor_requests(mentor_id,status,expires_at);
create index mentor_requests_service on public.mentor_requests(service_id);
create index mentor_grants_request on public.mentor_resource_grants(request_id,student_id,mentor_id);
create index mentor_grants_student on public.mentor_resource_grants(student_id);
create index mentor_grants_mentor on public.mentor_resource_grants(mentor_id);
create index mentor_comments_request on public.mentor_comments(request_id,created_at);
create index mentor_comments_grant on public.mentor_comments(grant_id);
create index mentor_comments_parent on public.mentor_comments(parent_id);
create index mentor_comments_author on public.mentor_comments(author_id);
create index mentor_reviews_request on public.mentor_reviews(request_id);
create index mentor_reviews_author on public.mentor_reviews(author_id);
create index mentor_slots_owner on public.mentor_slots(mentor_id,starts_at);
create index mentor_bookings_slot on public.mentor_bookings(slot_id);
create index mentor_bookings_request on public.mentor_bookings(request_id);
create index mentor_blocks_mentor on public.mentor_blocks(mentor_id);
create index mentor_reports_request on public.mentor_reports(request_id);
create index mentor_reports_queue on public.mentor_reports(status,created_at);
create index mentor_reports_reporter on public.mentor_reports(reporter_id);
create index mentor_events_subject on public.mentor_events(subject_id,created_at desc);
create index mentor_events_request on public.mentor_events(request_id);
create index mentor_events_actor on public.mentor_events(actor_id);
create index mentor_profile_reviewer on public.mentor_profiles(reviewed_by);
create index mentor_clearance_reviewer on public.mentor_student_clearances(reviewed_by);

create function jetu_private.mentor_staff_role(p_role text) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from jetu_private.mentor_staff where user_id=auth.uid() and role=p_role)
 and not jetu_private.is_account_deletion_pending();
$$;
-- The predicate reads protected trust tables as definer. No resource content is returned.
create function jetu_private.mentor_active(p_request uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not jetu_private.is_account_deletion_pending() and exists(
 select 1 from public.mentor_requests r join public.mentor_profiles m on m.user_id=r.mentor_id
 join public.mentor_student_clearances c on c.student_id=r.student_id
 where r.id=p_request and r.mentor_id=auth.uid() and m.state='verified'
 and r.status in ('submitted','accepted','in_review','needs_student_action','review_delivered')
 and r.revoked_at is null and r.expires_at>now() and c.approved_until>now()
 and not exists(select 1 from public.student_account_deletions d where d.user_id in (r.student_id,r.mentor_id))
 and not exists(select 1 from public.mentor_blocks b where b.student_id=r.student_id and b.mentor_id=r.mentor_id));
$$;
create function jetu_private.mentor_participant(p_request uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not jetu_private.is_account_deletion_pending() and
 (exists(select 1 from public.mentor_requests where id=p_request and student_id=auth.uid())
 or jetu_private.mentor_active(p_request));
$$;
revoke all on function jetu_private.mentor_staff_role(text),jetu_private.mentor_active(uuid),jetu_private.mentor_participant(uuid) from public,anon;
grant execute on function jetu_private.mentor_staff_role(text),jetu_private.mentor_active(uuid),jetu_private.mentor_participant(uuid) to authenticated;

do $$ declare t text; begin
 foreach t in array array['mentor_request_drafts','mentor_profiles','mentor_evidence','mentor_services','mentor_student_clearances','mentor_requests','mentor_resource_grants','mentor_comments','mentor_reviews','mentor_slots','mentor_bookings','mentor_blocks','mentor_reports','mentor_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
create policy mentor_draft_read on public.mentor_request_drafts for select to authenticated using(student_id=(select auth.uid()) and not jetu_private.is_account_deletion_pending());
create policy mentor_profile_read on public.mentor_profiles for select to authenticated using(user_id=(select auth.uid()) or jetu_private.mentor_staff_role('verifier'));
create policy mentor_evidence_read on public.mentor_evidence for select to authenticated using(mentor_id=(select auth.uid()) or jetu_private.mentor_staff_role('verifier'));
create policy mentor_service_read on public.mentor_services for select to authenticated using(mentor_id=(select auth.uid()));
create policy mentor_clearance_read on public.mentor_student_clearances for select to authenticated using(student_id=(select auth.uid()) or jetu_private.mentor_staff_role('moderator'));
create policy mentor_request_read on public.mentor_requests for select to authenticated using(jetu_private.mentor_participant(id));
create policy mentor_grant_read on public.mentor_resource_grants for select to authenticated using(jetu_private.mentor_participant(request_id));
create policy mentor_comment_read on public.mentor_comments for select to authenticated using(jetu_private.mentor_participant(request_id));
create policy mentor_review_read on public.mentor_reviews for select to authenticated using(jetu_private.mentor_participant(request_id));
create policy mentor_slot_read on public.mentor_slots for select to authenticated using(mentor_id=(select auth.uid()));
create policy mentor_booking_read on public.mentor_bookings for select to authenticated using(jetu_private.mentor_participant(request_id));
create policy mentor_block_read on public.mentor_blocks for select to authenticated using(student_id=(select auth.uid()));
create policy mentor_report_read on public.mentor_reports for select to authenticated using(reporter_id=(select auth.uid()) or jetu_private.mentor_staff_role('moderator'));
create policy mentor_event_read on public.mentor_events for select to authenticated using(subject_id=(select auth.uid()) or (request_id is not null and jetu_private.mentor_participant(request_id)));
grant usage,select on sequence public.mentor_events_id_seq to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('mentor-evidence','mentor-evidence',false,3145728,array['application/pdf','image/png','image/jpeg']);
-- Evidence has no browser SELECT policy: no signed URLs or cross-mentor downloads.
create policy mentor_evidence_insert on storage.objects for insert to authenticated with check(
 bucket_id='mentor-evidence' and not jetu_private.is_account_deletion_pending()
 and exists(select 1 from public.mentor_evidence e where e.mentor_id=(select auth.uid()) and e.object_path=name and e.state='reserved' and e.created_at>now()-interval '15 minutes'));

create function jetu_private.mentor_safe_text(p_text text) returns boolean language sql immutable set search_path='' as $$
 select p_text is not null and regexp_replace(p_text,'[0-9]{4}-[0-9]{2}-[0-9]{2}','','g') !~* '(https?://|www\.|@[[:alnum:]_]|[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}|[+]?[0-9][0-9 ()-]{7,}[0-9]|telegram|whatsapp|instagram|snapchat|discord|телеграм|ватсап)';
$$;
-- Public projection intentionally excludes identity evidence, staff decisions and contacts.
create function public.mentor_directory() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',m.user_id,'name',m.display_name,'bio',m.bio,'expertise',m.expertise,'languages',m.languages,'countries',m.countries,'degrees',m.degrees,'timezone',m.timezone,'verifiedSummary',m.verified_summary,'capacity',m.capacity,'services',coalesce((select jsonb_agg(to_jsonb(s)-'mentor_id') from public.mentor_services s where s.mentor_id=m.user_id and s.active),'[]'::jsonb),'slots',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'starts_at',s.starts_at,'ends_at',s.ends_at,'timezone',s.timezone)) from public.mentor_slots s where s.mentor_id=m.user_id and s.cancelled_at is null and s.starts_at>now() and not exists(select 1 from public.mentor_bookings b where b.slot_id=s.id and b.state<>'cancelled')),'[]'::jsonb)) order by m.updated_at desc),'[]'::jsonb)
 from (select * from public.mentor_profiles p where state='verified' and accepting and not exists(select 1 from public.student_account_deletions d where d.user_id=p.user_id) and exists(select 1 from public.mentor_services s where s.mentor_id=user_id and s.active) order by updated_at desc limit 100) m;
$$;
revoke all on function public.mentor_directory() from public;
grant execute on function public.mentor_directory() to anon,authenticated;

-- All writes share locks with revocation, trust decisions and clearances.
-- auth.uid() is the only actor; the API validates the same discriminated input.
create function public.mentor_command(p_input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); op text:=p_input->>'op'; rid uuid; gid uuid; eid uuid;
 r public.mentor_requests; m public.mentor_profiles; s public.mentor_services;
 g public.mentor_resource_grants; cm public.mentor_comments; rp public.mentor_reports;
 item jsonb; snap jsonb; result jsonb; body text; state_value text; fingerprint text;
 v_id uuid; n integer; mentor uuid; t0 timestamptz; t1 timestamptz; staff boolean;
begin
 if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 if jsonb_typeof(p_input)<>'object' or octet_length(p_input::text)>60000 then raise check_violation; end if;
 -- One transaction lock serializes consent, suspension, review and capacity. Expected
 -- pilot volume is small; split by mentor only after lock-order tests at scale.
 perform pg_advisory_xact_lock(220022);
 if op in ('apply','evidence_reserve','evidence_submit','service','slot') then
   select * into m from public.mentor_profiles where user_id=u for update;
   if op='apply' then
     if found and m.state not in ('draft','needs_info','rejected') then raise insufficient_privilege; end if;
     if exists(select 1 from jsonb_array_elements_text(p_input->'countries') c where c !~ '^[A-Z]{2}$') or not coalesce((p_input->>'terms')::boolean,false) or not exists(select 1 from pg_timezone_names where name=p_input->>'timezone') then raise check_violation; end if;
     if not jetu_private.mentor_safe_text(concat(p_input->>'name',' ',p_input->>'bio',' ',p_input->'expertise')) then raise check_violation; end if;
     insert into public.mentor_profiles(user_id,display_name,bio,expertise,languages,countries,degrees,timezone,capacity,state)
     values(u,p_input->>'name',p_input->>'bio',array(select jsonb_array_elements_text(p_input->'expertise')),array(select jsonb_array_elements_text(p_input->'languages')),array(select jsonb_array_elements_text(p_input->'countries')),array(select jsonb_array_elements_text(p_input->'degrees')),p_input->>'timezone',(p_input->>'capacity')::int,'draft')
     on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,expertise=excluded.expertise,languages=excluded.languages,countries=excluded.countries,degrees=excluded.degrees,timezone=excluded.timezone,capacity=excluded.capacity,state='draft',revision=public.mentor_profiles.revision+1,updated_at=now();
     result:=jsonb_build_object('id',u);
   elsif m.user_id is null then raise insufficient_privilege;
   elsif op='evidence_reserve' then
     if m.state not in ('draft','needs_info','rejected') then raise insufficient_privilege; end if;
     if (select count(*) from public.mentor_evidence where mentor_id=u and created_at>now()-interval '1 day')>=10 then raise exception using errcode='P0001',message='quota'; end if;
     eid:=gen_random_uuid();
     insert into public.mentor_evidence(id,mentor_id,claim,object_path,mime,byte_size) values(eid,u,p_input->>'claim',u::text||'/'||eid::text,p_input->>'mime',(p_input->>'size')::int);
     result:=jsonb_build_object('id',eid,'path',u::text||'/'||eid::text);
   elsif op='evidence_submit' then
     update public.mentor_evidence e set state='submitted' where e.id=(p_input->>'id')::uuid and e.mentor_id=u and e.state='reserved' and exists(select 1 from storage.objects o where o.bucket_id='mentor-evidence' and o.name=e.object_path);
     if not found then raise check_violation; end if;
     update public.mentor_profiles set state='submitted',accepting=false,revision=revision+1,updated_at=now() where user_id=u;
     result:=jsonb_build_object('state','submitted');
   elsif op='service' then
     if not jetu_private.mentor_safe_text(concat(p_input->>'summary',' ',p_input->>'deliverables')) then raise check_violation; end if;
     insert into public.mentor_services(mentor_id,kind,summary,deliverables,turnaround_hours,price_minor,currency,active)
     values(u,p_input->>'kind',p_input->>'summary',p_input->>'deliverables',(p_input->>'hours')::int,(p_input->>'price')::int,p_input->>'currency',true)
     on conflict(mentor_id,kind) do update set summary=excluded.summary,deliverables=excluded.deliverables,turnaround_hours=excluded.turnaround_hours,price_minor=excluded.price_minor,currency=excluded.currency;
     if m.state='verified' then update public.mentor_profiles set accepting=true where user_id=u; end if;
     result:='{}';
   elsif op='slot' then
     if m.state<>'verified' then raise insufficient_privilege; end if;
     t0:=(p_input->>'start')::timestamptz; t1:=(p_input->>'end')::timestamptz;
     if t0<=now() or t0>now()+interval '90 days' or not exists(select 1 from pg_timezone_names where name=p_input->>'timezone') or exists(select 1 from public.mentor_slots where mentor_id=u and cancelled_at is null and starts_at<t1 and ends_at>t0) then raise check_violation; end if;
     insert into public.mentor_slots(mentor_id,starts_at,ends_at,timezone) values(u,t0,t1,p_input->>'timezone'); result:='{}';
   end if;
   insert into public.mentor_events(subject_id,actor_id,kind) values(u,u,op); return result;
 end if;
 if op='verify' then
   if not jetu_private.mentor_staff_role('verifier') then raise insufficient_privilege; end if;
   mentor:=(p_input->>'mentor')::uuid; state_value:=p_input->>'state';
   select * into m from public.mentor_profiles where user_id=mentor for update;
   if m.user_id is null or mentor=u or m.revision<>(p_input->>'revision')::int then raise exception using errcode='40001',message='conflict'; end if;
   if not ((m.state='submitted' and state_value in ('needs_info','verified','rejected')) or (m.state='verified' and state_value in ('suspended','revoked')) or (m.state='suspended' and state_value in ('verified','revoked'))) then raise check_violation; end if;
   if length(btrim(p_input->>'reason'))<10 or not jetu_private.mentor_safe_text(p_input->>'summary') then raise check_violation; end if;
   if state_value='verified' and (not coalesce((p_input->>'attest')::boolean,false) or not exists(select 1 from public.mentor_evidence where mentor_id=mentor and state in ('submitted','reviewed') and retain_until>now())) then raise check_violation; end if;
   update public.mentor_profiles set state=state_value,verified_summary=p_input->>'summary',decision_reason=p_input->>'reason',reviewed_by=u,reviewed_at=now(),revision=revision+1,accepting=(state_value='verified'),updated_at=now() where user_id=mentor;
   update public.mentor_evidence set state='reviewed',retain_until=least(retain_until,now()+interval '7 days') where mentor_id=mentor and state='submitted';
   if state_value in ('suspended','revoked') then
     update public.mentor_requests set revoked_at=coalesce(revoked_at,now()),revision=revision+1 where mentor_id=mentor;
     update public.mentor_resource_grants set revoked_at=coalesce(revoked_at,now()) where request_id in(select id from public.mentor_requests where mentor_id=mentor);
   end if;
   if state_value in ('suspended','revoked') then update public.mentor_bookings set state='cancelled' where request_id in(select id from public.mentor_requests where mentor_id=mentor); end if;
   insert into public.mentor_events(subject_id,actor_id,kind,details) values(mentor,u,'verification',jsonb_build_object('from',m.state,'to',state_value,'reason',p_input->>'reason'));
   return '{}';
 end if;
 if op='clearance' then
   if not jetu_private.mentor_staff_role('moderator') or (p_input->>'student')::uuid=u then raise insufficient_privilege; end if;
   t0:=(p_input->>'until')::timestamptz;
   if t0>now()+interval '365 days' or length(btrim(p_input->>'reason'))<10 or not coalesce((p_input->>'attest')::boolean,false) then raise check_violation; end if;
   insert into public.mentor_student_clearances(student_id,approved_until,guardian_required,reviewed_by,reason)
   values((p_input->>'student')::uuid,t0,(p_input->>'guardianRequired')::boolean,u,p_input->>'reason')
   on conflict(student_id) do update set approved_until=excluded.approved_until,guardian_required=excluded.guardian_required,reviewed_by=u,reason=excluded.reason,updated_at=now();
   insert into public.mentor_events(subject_id,actor_id,kind) values((p_input->>'student')::uuid,u,'safeguarding_review'); return '{}';
 end if;
 if op='save_request_draft' then
   if length(coalesce(p_input->>'goal',''))>2000 or jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items')>10 then raise check_violation; end if;
   n:=coalesce((p_input->>'revision')::int,0);
   if n=0 then
     insert into public.mentor_request_drafts(student_id,service_id,goal,items,consent_until) values(u,(p_input->>'service')::uuid,coalesce(p_input->>'goal',''),p_input->'items',(p_input->>'expires')::timestamptz);
   else
     update public.mentor_request_drafts set goal=coalesce(p_input->>'goal',''),items=p_input->'items',consent_until=(p_input->>'expires')::timestamptz,revision=revision+1,updated_at=now() where student_id=u and service_id=(p_input->>'service')::uuid and revision=n;
     if not found then raise exception using errcode='40001',message='draft conflict'; end if;
   end if;
   return jsonb_build_object('revision',n+1);
 end if;
 if op='create' then
   fingerprint:=encode(extensions.digest((p_input-'key')::text,'sha256'),'hex');
   select * into r from public.mentor_requests where student_id=u and idempotency_key=(p_input->>'key')::uuid;
   if found then
     if r.payload_hash<>fingerprint then raise check_violation; end if;
     return jsonb_build_object('id',r.id);
   end if;
   if not coalesce((p_input->>'consent')::boolean,false) or p_input->>'policy' is distinct from 'mentor-consent-v1' then raise check_violation; end if;
   if not exists(select 1 from public.mentor_student_clearances where student_id=u and approved_until>now()) then raise insufficient_privilege; end if;
   select * into s from public.mentor_services where id=(p_input->>'service')::uuid and active;
   select * into m from public.mentor_profiles where user_id=s.mentor_id and state='verified' and accepting;
   if m.user_id is null or m.user_id=u or s.price_minor<>0 or exists(select 1 from public.mentor_blocks where student_id=u and mentor_id=m.user_id) then raise insufficient_privilege; end if;
   if not jetu_private.mentor_safe_text(p_input->>'goal') then raise check_violation; end if;
   if (select count(*) from public.mentor_requests where mentor_id=m.user_id and status in ('submitted','accepted','in_review','needs_student_action') and revoked_at is null and expires_at>now())>=m.capacity then raise exception using errcode='P0001',message='capacity'; end if;
   if (select count(*) from public.mentor_requests where student_id=u and created_at>now()-interval '1 day')>=10 then raise exception using errcode='P0001',message='quota'; end if;
   if jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items')>10 or (jsonb_array_length(p_input->'items')=0 and s.kind not in ('interview','session','shortlist')) then raise check_violation; end if;
   t0:=(p_input->>'expires')::timestamptz;
   if t0 is null or t0<=now() or t0>now()+interval '30 days' then raise check_violation; end if;
   insert into public.mentor_requests(student_id,mentor_id,service_id,goal,terms_snapshot,expires_at,due_at,idempotency_key,payload_hash)
   values(u,m.user_id,s.id,p_input->>'goal',to_jsonb(s)-'mentor_id',t0,now()+make_interval(hours=>s.turnaround_hours),(p_input->>'key')::uuid,fingerprint) returning id into rid;
   for item in select jsonb_array_elements(p_input->'items') loop
     snap:=null;
     if item->>'type'='writing' then
       select jsonb_build_object('title',v.snapshot->>'title') into snap from public.writing_versions v join public.writing_drafts d on d.id=v.draft_id
       where v.id=(item->>'version')::uuid and v.draft_id=(item->>'resource')::uuid and v.user_id=u and not coalesce((d.studio->>'archived')::boolean,false)
       and ((s.kind in ('essay','scholarship','sop') and d.kind not in ('cv','activities','interview')) or (s.kind='cv' and d.kind in ('cv','activities')) or s.kind='readiness');
     elsif item->>'type'='vault' then
       select jsonb_build_object('title',d.display_name) into snap from public.vault_versions v join public.vault_documents d on d.id=v.document_id
       where v.id=(item->>'version')::uuid and d.id=(item->>'resource')::uuid and d.user_id=u and d.category in ('cv','essay','transcript','certificate','language_test') and d.sensitivity<>'restricted' and d.deleted_at is null and d.archived_at is null and d.expires_at>now() and v.state='available' and v.scanned_at is not null and s.kind in ('documents','readiness','cv');
     elsif item->>'type'='application' then
       select jsonb_build_object('title',a.program_title_snapshot,'institution',a.institution_name_snapshot,'state',a.status,'source',a.program_source_url,'sourceCheckedAt',a.program_source_checked_at,'deadlinePrecision',a.official_deadline_precision,'deadline',coalesce(a.official_deadline_at::text,a.official_deadline_date::text),'timezone',a.official_deadline_timezone,'version',a.version,'checklist',coalesce((select jsonb_agg(jsonb_build_object('title',c.title,'status',c.status,'verification',c.verification_state,'claimId',c.source_claim_id)) from public.application_checklist_items c where c.application_id=a.id),'[]'::jsonb)) into snap from public.applications a
       where a.id=(item->>'resource')::uuid and a.id=(item->>'version')::uuid and a.user_id=u and a.archived_at is null and s.kind in ('readiness','shortlist','documents');
     end if;
     if snap is null then raise insufficient_privilege; end if;
     insert into public.mentor_resource_grants(request_id,student_id,mentor_id,resource_type,resource_id,version_id,operations,snapshot,expires_at)
     values(rid,u,m.user_id,item->>'type',(item->>'resource')::uuid,(item->>'version')::uuid,case when item->>'type'='vault' and coalesce((item->>'download')::boolean,false) then array['view','comment','review','download'] else array['view','comment','review'] end,snap,t0);
   end loop;
   insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(rid,u,u,'consent_granted',jsonb_build_object('policy','mentor-consent-v1','items',jsonb_array_length(p_input->'items'),'expires',t0));
   delete from public.mentor_request_drafts where student_id=u and service_id=s.id;
   return jsonb_build_object('id',rid);
 end if;
 if op='moderate' then
   if not jetu_private.mentor_staff_role('moderator') then raise insufficient_privilege; end if;
   select * into rp from public.mentor_reports where id=(p_input->>'id')::uuid for update;
   if rp.id is null or rp.revision<>(p_input->>'revision')::int then raise exception using errcode='40001',message='conflict'; end if;
   state_value:=p_input->>'state';
   if not ((rp.status='new' and state_value='triaged') or (rp.status='triaged' and state_value='investigating') or (rp.status='investigating' and state_value in ('actioned','closed')) or (rp.status='appealed' and state_value='investigating')) or length(btrim(p_input->>'reason'))<10 then raise check_violation; end if;
   update public.mentor_reports set status=state_value,resolution=p_input->>'reason',revision=revision+1,updated_at=now() where id=rp.id;
   insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(rp.request_id,rp.reporter_id,u,'moderation',jsonb_build_object('state',state_value)); return '{}';
 end if;
 rid:=(p_input->>'request')::uuid;
 select * into r from public.mentor_requests where id=rid for update;
 if r.id is null or (r.student_id<>u and not jetu_private.mentor_active(rid)) then raise insufficient_privilege; end if;
 if op in ('revoke','cancel','block','report','appeal') then
   if r.student_id<>u then raise insufficient_privilege; end if;
   if op in ('revoke','cancel','block') then
     update public.mentor_requests set revoked_at=coalesce(revoked_at,now()),status=case when op='cancel' then 'cancelled' else status end,revision=revision+1,updated_at=now() where id=rid;
     update public.mentor_resource_grants set revoked_at=coalesce(revoked_at,now()) where request_id=rid;
   end if;
   if op='block' then
     insert into public.mentor_blocks(student_id,mentor_id) values(u,r.mentor_id) on conflict do nothing;
     update public.mentor_requests set revoked_at=coalesce(revoked_at,now()),revision=revision+1 where student_id=u and mentor_id=r.mentor_id;
     update public.mentor_resource_grants set revoked_at=coalesce(revoked_at,now()) where request_id in(select id from public.mentor_requests where student_id=u and mentor_id=r.mentor_id);
   elsif op='report' then
     if (select count(*) from public.mentor_reports where reporter_id=u and created_at>now()-interval '1 day')>=5 then raise exception using errcode='P0001',message='quota'; end if;
     insert into public.mentor_reports(request_id,reporter_id,reason,explanation) values(rid,u,p_input->>'reason',coalesce(p_input->>'explanation',''));
   elsif op='appeal' then
     update public.mentor_reports set status='appealed',revision=revision+1,updated_at=now() where id=(p_input->>'id')::uuid and reporter_id=u and request_id=rid and status in ('closed','actioned');
     if not found then raise check_violation; end if;
   end if;
 elsif op='transition' then
   if r.revoked_at is not null or r.expires_at<=now() then raise insufficient_privilege; end if;
   if r.revision<>(p_input->>'revision')::int then raise exception using errcode='40001',message='conflict'; end if;
   state_value:=p_input->>'state';
   if not ((u=r.mentor_id and ((r.status='submitted' and state_value='accepted') or (r.status='accepted' and state_value='in_review') or (r.status='in_review' and state_value='needs_student_action'))) or (u=r.student_id and ((r.status='needs_student_action' and state_value='in_review') or (r.status='review_delivered' and state_value in ('completed','needs_student_action','disputed'))))) then raise check_violation; end if;
   update public.mentor_requests set status=state_value,revision=revision+1,updated_at=now(),revoked_at=case when state_value in ('completed','disputed') then now() else revoked_at end where id=rid;
   if state_value in ('completed','disputed') then update public.mentor_resource_grants set revoked_at=coalesce(revoked_at,now()) where request_id=rid; end if;
 elsif op='comment' then
   if r.revoked_at is not null or r.expires_at<=now() or r.status not in ('accepted','in_review','needs_student_action','review_delivered') then raise insufficient_privilege; end if;
   if not exists(select 1 from public.mentor_student_clearances where student_id=r.student_id and approved_until>now()) or exists(select 1 from public.mentor_blocks where student_id=r.student_id and mentor_id=r.mentor_id) then raise insufficient_privilege; end if;
   body:=p_input->>'body';
   if not jetu_private.mentor_safe_text(body) then raise check_violation; end if;
   select * into cm from public.mentor_comments where author_id=u and idempotency_key=(p_input->>'key')::uuid;
   if found then
     if cm.request_id<>rid or cm.body<>body or cm.grant_id is distinct from (p_input->>'grant')::uuid or cm.anchor is distinct from p_input->'anchor' or cm.parent_id is distinct from (p_input->>'parent')::uuid then raise check_violation; end if;
     return jsonb_build_object('id',cm.id);
   end if;
   if (select count(*) from public.mentor_comments where author_id=u and created_at>now()-interval '1 hour')>=60 then raise exception using errcode='P0001',message='quota'; end if;
   gid:=(p_input->>'grant')::uuid;
   if gid is not null then
     select * into g from public.mentor_resource_grants where id=gid and request_id=rid and revoked_at is null and expires_at>now() and 'comment'=any(operations);
     if g.id is null then raise insufficient_privilege; end if;
     perform public.mentor_resource(g.id,'view');
     if p_input->'anchor' is not null and p_input->'anchor'<>'null' then
       if g.resource_type<>'writing' then raise check_violation; end if;
       select v.snapshot->>'content' into body from public.writing_versions v where v.id=g.version_id and v.user_id=r.student_id;
       -- Anchors use Unicode code points (not UTF-16) on immutable versions.
       if (p_input->'anchor'->>'start')::int<0 or (p_input->'anchor'->>'end')::int<=(p_input->'anchor'->>'start')::int or (p_input->'anchor'->>'end')::int>length(body) or substring(body from (p_input->'anchor'->>'start')::int+1 for (p_input->'anchor'->>'end')::int-(p_input->'anchor'->>'start')::int) is distinct from p_input->'anchor'->>'quote' then raise check_violation; end if;
     end if;
   elsif p_input->'anchor' is not null and p_input->'anchor'<>'null' then raise check_violation;
   end if;
   if p_input->>'parent' is not null and not exists(select 1 from public.mentor_comments where id=(p_input->>'parent')::uuid and request_id=rid and grant_id is not distinct from gid) then raise check_violation; end if;
   insert into public.mentor_comments(request_id,grant_id,author_id,parent_id,body,anchor,idempotency_key) values(rid,gid,u,(p_input->>'parent')::uuid,p_input->>'body',nullif(p_input->'anchor','null'),(p_input->>'key')::uuid) returning id into eid;
   result:=jsonb_build_object('id',eid);
 elsif op='resolve' then
   if r.student_id<>u then raise insufficient_privilege; end if;
   update public.mentor_comments set disposition=p_input->>'state',revision=revision+1 where id=(p_input->>'id')::uuid and request_id=rid and revision=(p_input->>'revision')::int and p_input->>'state' in ('resolved','rejected','suggested');
   if not found then raise exception using errcode='40001',message='conflict'; end if;
 elsif op='review' then
   if r.mentor_id<>u or not jetu_private.mentor_active(rid) or r.status not in ('in_review','needs_student_action','review_delivered') then raise insufficient_privilege; end if;
   select to_jsonb(v) into result from public.mentor_reviews v where author_id=u and idempotency_key=(p_input->>'key')::uuid;
   if result is not null then
     if result->>'request_id'<>rid::text or result->>'summary'<>p_input->>'summary' or result->'rubric'<>p_input->'rubric' or result->'actions'<>p_input->'actions' or result->>'outcome'<>p_input->>'outcome' then raise check_violation; end if;
     return result;
   end if;
   if not jetu_private.mentor_safe_text(p_input->>'summary') or jsonb_typeof(p_input->'rubric')<>'object' or jsonb_typeof(p_input->'actions')<>'array' or jsonb_array_length(p_input->'actions')>10 then raise check_violation; end if;
   foreach state_value in array array['clarity','structure','specificity','evidence','voice','prompt_fit','grammar'] loop
     if not (p_input->'rubric' ? state_value) or (p_input->'rubric'->>state_value)::int not between 1 and 5 then raise check_violation; end if;
   end loop;
   for item in select jsonb_array_elements(p_input->'actions') loop
     if length(btrim(item->>'text')) not between 3 and 500 or not jetu_private.mentor_safe_text(item->>'text') or (item->>'source' is not null and item->>'source' !~ '^https://[^[:space:]@]+$') then raise check_violation; end if;
   end loop;
   if not exists(select 1 from public.mentor_resource_grants where request_id=rid and revoked_at is null and expires_at>now() and 'review'=any(operations)) and (r.terms_snapshot->>'kind') not in ('interview','session','shortlist') then raise insufficient_privilege; end if;
   for gid in select id from public.mentor_resource_grants where request_id=rid and revoked_at is null and expires_at>now() loop perform public.mentor_resource(gid,'view'); end loop;
   insert into public.mentor_reviews(request_id,author_id,outcome,summary,rubric,actions,idempotency_key) values(rid,u,p_input->>'outcome',p_input->>'summary',p_input->'rubric',p_input->'actions',(p_input->>'key')::uuid);
   update public.mentor_requests set status='review_delivered',revision=revision+1,updated_at=now() where id=rid;
 elsif op='book' then
   if r.student_id<>u or r.revoked_at is not null or r.expires_at<=now() or r.status not in ('accepted','in_review','needs_student_action') or not exists(select 1 from public.mentor_profiles where user_id=r.mentor_id and state='verified') or not exists(select 1 from public.mentor_student_clearances where student_id=u and approved_until>now()) or exists(select 1 from public.mentor_blocks where student_id=u and mentor_id=r.mentor_id) then raise insufficient_privilege; end if;
   select to_jsonb(b) into result from public.mentor_bookings b where request_id=rid and idempotency_key=(p_input->>'key')::uuid;
   if result is not null then
     if result->>'slot_id'<>p_input->>'slot' then raise check_violation; end if;
     return result;
   end if;
   if not exists(select 1 from public.mentor_slots where id=(p_input->>'slot')::uuid and mentor_id=r.mentor_id and starts_at>now() and ends_at<r.expires_at and cancelled_at is null) then raise check_violation; end if;
   if exists(select 1 from public.mentor_bookings where request_id=rid and state<>'cancelled') then raise check_violation; end if;
   insert into public.mentor_bookings(request_id,slot_id,idempotency_key) values(rid,(p_input->>'slot')::uuid,(p_input->>'key')::uuid);
 elsif op='cancel_booking' then
   update public.mentor_bookings set state='cancelled' where id=(p_input->>'id')::uuid and request_id=rid;
   if not found then raise insufficient_privilege; end if;
 else raise check_violation;
 end if;
 if op in ('revoke','cancel','block') or (op='transition' and state_value in ('completed','disputed')) then
   update public.mentor_bookings set state='cancelled' where request_id in(select id from public.mentor_requests where student_id=r.student_id and (id=rid or (op='block' and mentor_id=r.mentor_id)));
 end if;
 insert into public.mentor_events(request_id,subject_id,actor_id,kind,details) values(rid,r.student_id,u,op,jsonb_build_object('state',case when op='transition' then p_input->>'state' else null end));
 return coalesce(result,'{}'::jsonb);
end;
$$;
revoke all on function public.mentor_command(jsonb) from public,anon;
grant execute on function public.mentor_command(jsonb) to authenticated;

-- Fresh grant check for every resource read. Mentor never gets direct table/storage
-- policies; server proxy downloads using a descriptor checked twice in its request.
create function public.mentor_resource(p_grant uuid,p_operation text default 'view') returns jsonb
language plpgsql security definer set search_path='' as $$
declare g public.mentor_resource_grants; r public.mentor_requests; result jsonb;
begin
 if auth.uid() is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(220022);
 select * into g from public.mentor_resource_grants where id=p_grant;
 select * into r from public.mentor_requests where id=g.request_id;
 if r.id is null or g.student_id<>r.student_id or g.mentor_id<>r.mentor_id or (r.student_id<>auth.uid() and not jetu_private.mentor_active(r.id)) or g.revoked_at is not null or g.expires_at<=now() or r.revoked_at is not null or r.expires_at<=now() or p_operation not in ('view','download') or not p_operation=any(g.operations) then raise insufficient_privilege; end if;
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

-- Evidence descriptor never contains a signed URL. Only applicant or a verifier
-- can ask for the private proxy descriptor, and expired evidence fails closed.
create function public.mentor_evidence_access(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e public.mentor_evidence;
begin
 if auth.uid() is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 select * into e from public.mentor_evidence where id=p_id and retain_until>now() and state in ('submitted','reviewed');
 if e.id is null or (e.mentor_id<>auth.uid() and not jetu_private.mentor_staff_role('verifier')) then raise insufficient_privilege; end if;
 insert into public.mentor_events(subject_id,actor_id,kind,details) values(e.mentor_id,auth.uid(),'evidence_read',jsonb_build_object('evidence',e.id));
 return jsonb_build_object('path',e.object_path,'mime',e.mime,'size',e.byte_size);
end;
$$;
revoke all on function public.mentor_evidence_access(uuid) from public,anon;
grant execute on function public.mentor_evidence_access(uuid) to authenticated;

create function public.mentor_actor() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',auth.uid(),'verifier',jetu_private.mentor_staff_role('verifier'),'moderator',jetu_private.mentor_staff_role('moderator')) where auth.uid() is not null and not jetu_private.is_account_deletion_pending();
$$;
revoke all on function public.mentor_actor() from public,anon;
grant execute on function public.mentor_actor() to authenticated;
commit;
