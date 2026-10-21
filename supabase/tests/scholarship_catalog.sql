-- Disposable role/integrity probe. Run after migration replay; every fixture rolls back.
begin;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111');
set role service_role;
select public.scholarship_create_draft(
  '{"slug":"synthetic-local-probe","title":"Synthetic local probe","provider_name":"Example Provider","official_url":"https://example.invalid/scholarship","source":{"url":"https://example.invalid/source","title":"Synthetic source","publisher":"Example Provider","excerpt":"Synthetic local fixture only, never a live scholarship.","locale":"en"}}'::jsonb,
  '11111111-1111-4111-8111-111111111111'
);
do $$ begin
  if (select count(*) from public.scholarships where slug='synthetic-local-probe')<>1 then
    raise exception 'draft creation failed';
  end if;
  if (select publication_status_code from public.catalog_entities where id=(select id from public.scholarships where slug='synthetic-local-probe'))<>'draft' then
    raise exception 'draft published unexpectedly';
  end if;
end $$;
reset role;
set role anon;
do $$ begin
  if (select count(*) from public.scholarship_search('synthetic-local-probe',20,0,null))<>0 then
    raise exception 'anonymous user saw a draft';
  end if;
  if has_table_privilege('anon','public.scholarship_editor_notes','SELECT') then
    raise exception 'anonymous editorial access';
  end if;
end $$;
reset role;
set role service_role;
select public.scholarship_transition((select id from public.scholarships where slug='synthetic-local-probe'),
  'reviewed','11111111-1111-4111-8111-111111111111','Synthetic official source check recorded locally');
insert into public.scholarship_funding_profiles(scholarship_id,funding_label,source_claim_id)
select s.id,'full_tuition',sc.id from public.scholarships s
join public.source_claims sc on sc.catalog_entity_id=s.id
where s.slug='synthetic-local-probe';
do $$ begin
  begin
    perform public.scholarship_transition((select id from public.scholarships where slug='synthetic-local-probe'),
      'published','11111111-1111-4111-8111-111111111111',null);
    raise exception 'unsupported full tuition claim was published';
  exception when check_violation then null;
  end;
end $$;
update public.scholarship_funding_profiles set funding_label='unknown' where scholarship_id=(select id from public.scholarships where slug='synthetic-local-probe');
select public.scholarship_transition((select id from public.scholarships where slug='synthetic-local-probe'),
  'published','11111111-1111-4111-8111-111111111111',null);
reset role;
set role anon;
do $$ begin
  if (select count(*) from public.scholarship_search('synthetic-local-probe',20,0,null))<>1 then
    raise exception 'published scholarship not visible';
  end if;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.student_scholarship_saves(user_id,scholarship_id)
select auth.uid(),id from public.scholarships where slug='synthetic-local-probe';
do $$ begin
  if (select count(*) from public.student_scholarship_saves)<>1 then raise exception 'own save missing'; end if;
  if has_table_privilege('authenticated','public.scholarship_editor_notes','SELECT') then
    raise exception 'student editorial access';
  end if;
end $$;
reset role;
rollback;
