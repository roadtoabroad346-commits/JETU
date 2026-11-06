-- Keep future-cycle evidence out of current deadline provenance.
begin;
create or replace view public.calendar_events with(security_invoker=true) as
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
 and (sc.effective_from is null or sc.effective_from<=current_date)
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
commit;
