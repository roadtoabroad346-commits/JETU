-- Full authenticated RPC policy probe; synthetic records are rolled back.
begin;
insert into auth.users(id) values
  ('22222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333');
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
  begin
    perform public.scholarship_editor_preview('synthetic-editor-probe');
    raise exception 'unauthorized user reached editorial RPC';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
insert into public.scholarship_editor_memberships(user_id,role) values
  ('22222222-2222-4222-8222-222222222222','editor'),
  ('33333333-3333-4333-8333-333333333333','reviewer');
set role authenticated;
do $$ begin
  if public.scholarship_editor_preview('synthetic-editor-probe') then
    raise exception 'duplicate preview gave false positive';
  end if;
end $$;
select public.scholarship_editor_create_draft(
  '{"slug":"synthetic-editor-probe","title":"Synthetic editor probe","provider_name":"Example Provider","official_url":"https://example.invalid/editor","source":{"url":"https://example.invalid/editor-source","title":"Synthetic editor source","publisher":"Example Provider","excerpt":"Synthetic local editorial fixture only.","locale":"en"}}'::jsonb
);
do $$ begin
  if not public.scholarship_editor_preview('synthetic-editor-probe') then
    raise exception 'duplicate preview missed existing slug';
  end if;
  begin
    perform public.scholarship_editor_transition((select id from public.scholarship_editor_list() where slug='synthetic-editor-probe'),'published',null);
    raise exception 'editor published without reviewer role';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select public.scholarship_editor_transition((select id from public.scholarship_editor_list() where slug='synthetic-editor-probe'),
  'reviewed','Official source checked in synthetic rollback probe');
select public.scholarship_editor_transition((select id from public.scholarship_editor_list() where slug='synthetic-editor-probe'),
  'published',null);
reset role;
set role anon;
do $$ begin
  if (select count(*) from public.scholarship_search('synthetic-editor-probe',20,0,null,null,null,'recent'))<>1 then
    raise exception 'reviewed scholarship was not public';
  end if;
end $$;
reset role;
rollback;
