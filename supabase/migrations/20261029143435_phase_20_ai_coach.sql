begin;

create table public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null check (locale in ('ru','kk','en')),
  title text not null default 'JETU Coach' check (length(title) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  unique(id,user_id)
);
create index coach_conversations_owner on public.coach_conversations(user_id,updated_at desc);
create index coach_conversations_expiry on public.coach_conversations(expires_at);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content jsonb not null check (octet_length(content::text) <= 50000),
  created_at timestamptz not null default now(),
  foreign key(conversation_id,user_id) references public.coach_conversations(id,user_id) on delete cascade,
  unique(id,user_id)
);
create index coach_messages_owner on public.coach_messages(user_id,conversation_id,created_at);
create index coach_messages_conversation on public.coach_messages(conversation_id,user_id);

create table public.coach_feedback (
  message_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  helpful boolean not null,
  updated_at timestamptz not null default now(),
  foreign key(message_id,user_id) references public.coach_messages(id,user_id) on delete cascade
);
create index coach_feedback_owner on public.coach_feedback(user_id);

create table public.coach_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  conversation_id uuid references public.coach_conversations(id) on delete set null,
  remember boolean not null,
  external_ai boolean not null,
  status text not null default 'pending' check (status in ('pending','complete','failed')),
  reserved_tokens integer not null check (reserved_tokens in (0,100000)),
  reserved_usd_micros integer not null check (reserved_usd_micros in (0,500000)),
  actual_tokens integer check (actual_tokens >= 0),
  tool_names text[] not null default '{}',
  response jsonb check (octet_length(response::text) <= 50000),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (remember or (conversation_id is null and response is null))
);
create index coach_requests_owner_time on public.coach_requests(user_id,created_at desc);
create index coach_requests_conversation on public.coach_requests(conversation_id);

alter table public.coach_conversations enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_feedback enable row level security;
alter table public.coach_requests enable row level security;
revoke all on public.coach_conversations,public.coach_messages,public.coach_feedback,public.coach_requests from anon,authenticated;
grant select on public.coach_conversations,public.coach_messages to authenticated;
grant select(id,user_id,external_ai,status,reserved_tokens,reserved_usd_micros,actual_tokens,created_at) on public.coach_requests to authenticated;
grant select,insert,update,delete on public.coach_feedback to authenticated;
grant all on public.coach_conversations,public.coach_messages,public.coach_feedback,public.coach_requests to service_role;

create policy coach_conversations_read on public.coach_conversations for select to authenticated using ((select auth.uid())=user_id and expires_at>now());
create policy coach_messages_read on public.coach_messages for select to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.coach_conversations c where c.id=conversation_id and c.user_id=(select auth.uid()) and c.expires_at>now()));
create policy coach_requests_read on public.coach_requests for select to authenticated using ((select auth.uid())=user_id and created_at>now()-interval '30 days');
create policy coach_feedback_read on public.coach_feedback for select to authenticated using ((select auth.uid())=user_id);
create policy coach_feedback_write on public.coach_feedback for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.coach_messages m where m.id=message_id and m.user_id=(select auth.uid()) and m.role='assistant'));
create policy coach_feedback_update on public.coach_feedback for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and exists(select 1 from public.coach_messages m where m.id=message_id and m.user_id=(select auth.uid()) and m.role='assistant'));
create policy coach_feedback_delete on public.coach_feedback for delete to authenticated using ((select auth.uid())=user_id);

-- Only the authenticated server may reserve provider spend or write an answer.
-- These invoker functions do not grant privileged execution to browser roles.
create function public.coach_reserve(p_owner uuid,p_request uuid,p_hash text,p_conversation uuid,p_locale text,p_remember boolean,p_external boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare previous public.coach_requests; conversation uuid; used integer; external_used integer;
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  if p_owner is null then raise insufficient_privilege; end if;
  if p_request is null or p_hash is null or p_locale is null or p_remember is null or p_external is null or p_locale not in ('ru','kk','en') or p_hash !~ '^[a-f0-9]{64}$' then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended('coach:'||p_owner::text,0));
  update public.coach_requests set response=null where user_id=p_owner and conversation_id in (select id from public.coach_conversations where user_id=p_owner and expires_at<=now());
  delete from public.coach_conversations where user_id=p_owner and expires_at<=now();
  select * into previous from public.coach_requests where id=p_request;
  if found then
    if previous.user_id<>p_owner or previous.input_hash<>p_hash then raise exception 'Request conflict' using errcode='40001'; end if;
    if previous.status='complete' and previous.response is not null then return jsonb_build_object('replay',previous.response); end if;
    raise exception 'Request already used' using errcode='40001';
  end if;
  select count(*),count(*) filter(where external_ai) into used,external_used from public.coach_requests where user_id=p_owner and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if used>=20 or (p_external and external_used>=5) or
    (select count(*) from public.coach_requests where user_id=p_owner and created_at>now()-interval '1 minute')>=6 or
    exists(select 1 from public.coach_requests where user_id=p_owner and status='pending' and created_at>now()-interval '90 seconds') then
    raise exception 'Coach quota reached' using errcode='P0001';
  end if;
  if not p_remember and p_conversation is not null then raise check_violation; end if;
  if p_remember then
    if p_conversation is null then
      insert into public.coach_conversations(user_id,locale) values(p_owner,p_locale) returning id into conversation;
    else
      select id into conversation from public.coach_conversations where id=p_conversation and user_id=p_owner and expires_at>now();
      if conversation is null then raise insufficient_privilege; end if;
    end if;
  end if;
  insert into public.coach_requests(id,user_id,input_hash,conversation_id,remember,external_ai,reserved_tokens,reserved_usd_micros)
    values(p_request,p_owner,p_hash,conversation,p_remember,p_external,case when p_external then 100000 else 0 end,case when p_external then 500000 else 0 end);
  return jsonb_build_object('conversationId',conversation);
end $$;

create function public.coach_finish(p_owner uuid,p_request uuid,p_answer jsonb,p_question text,p_tools text[],p_tokens integer,p_success boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.coach_requests; message uuid; result jsonb;
begin
  if current_user <> 'service_role' or p_owner is null then raise insufficient_privilege; end if;
  select * into r from public.coach_requests where id=p_request and user_id=p_owner for update;
  if not found or r.status<>'pending' then raise exception 'Request conflict' using errcode='40001'; end if;
  if p_success is null or p_tokens is null or p_tokens<0 or p_tokens>100000 or octet_length(coalesce(p_question,''))>6000 or cardinality(p_tools)>8 or (p_success and (p_answer->>'version' is distinct from '1' or octet_length(p_answer::text)>45000)) then raise check_violation; end if;
  if p_success and r.remember then
    if not exists(select 1 from public.coach_conversations where id=r.conversation_id and user_id=p_owner and expires_at>now()) then raise insufficient_privilege; end if;
    if (select count(*) from public.coach_messages where conversation_id=r.conversation_id)>=100 then raise check_violation; end if;
    insert into public.coach_messages(conversation_id,user_id,role,content) values(r.conversation_id,p_owner,'user',to_jsonb(p_question));
    insert into public.coach_messages(conversation_id,user_id,role,content) values(r.conversation_id,p_owner,'assistant',p_answer) returning id into message;
    update public.coach_conversations set updated_at=now() where id=r.conversation_id;
  end if;
  result=jsonb_build_object('answer',p_answer,'conversationId',r.conversation_id,'messageId',message);
  update public.coach_requests set status=case when p_success then 'complete' else 'failed' end,completed_at=now(),actual_tokens=p_tokens,tool_names=p_tools,response=case when remember and p_success then result else null end where id=p_request;
  return result;
end $$;

create function public.coach_prune() returns void language sql security invoker set search_path='' as $$
  update public.coach_requests set response=null where conversation_id in (select id from public.coach_conversations where expires_at<=now());
  delete from public.coach_conversations where expires_at<=now();
  delete from public.coach_requests where created_at<now()-interval '90 days';
$$;
create function public.coach_delete_history(p_owner uuid,p_conversation uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
  if current_user<>'service_role' or p_owner is null then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended('coach:'||p_owner::text,0));
  update public.coach_requests set response=null where user_id=p_owner and (p_conversation is null or conversation_id=p_conversation);
  delete from public.coach_conversations where user_id=p_owner and (p_conversation is null or id=p_conversation);
end $$;
revoke all on function public.coach_reserve(uuid,uuid,text,uuid,text,boolean,boolean),public.coach_finish(uuid,uuid,jsonb,text,text[],integer,boolean),public.coach_prune(),public.coach_delete_history(uuid,uuid) from public,anon,authenticated;
grant execute on function public.coach_reserve(uuid,uuid,text,uuid,text,boolean,boolean),public.coach_finish(uuid,uuid,jsonb,text,text[],integer,boolean),public.coach_prune(),public.coach_delete_history(uuid,uuid) to service_role;
commit;
