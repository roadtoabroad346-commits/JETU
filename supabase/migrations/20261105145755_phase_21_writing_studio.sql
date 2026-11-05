-- Phase 21 extends the Phase 19 authority. Rollback: disable Studio routes;
-- retain private drafts/history. Never reset a hosted database.
begin;
create table public.writing_prompts (
  id uuid primary key default gen_random_uuid(),
  program_id bigint references public.degree_programs(id),
  scholarship_id bigint references public.scholarships(id),
  title text not null check(length(title) between 1 and 160),
  prompt text not null check(length(prompt) between 1 and 4000),
  cycle integer not null check(cycle between 2020 and 2100),
  source_url text not null check(source_url ~ '^https://[^[:space:]]+$'),
  verified_at timestamptz,
  valid_until date,
  state text not null default 'draft' check(state in ('draft','verified','stale','unknown')),
  word_limit integer check(word_limit between 1 and 20000),
  character_limit integer check(character_limit between 1 and 100000),
  count_spaces boolean,
  ai_policy text not null default 'unknown' check(ai_policy in ('unknown','allowed','coaching_only','prohibited')),
  check(state<>'verified' or (verified_at is not null and valid_until is not null))
);
create index writing_prompts_program on public.writing_prompts(program_id);
create index writing_prompts_scholarship on public.writing_prompts(scholarship_id);
alter table public.writing_prompts enable row level security;
revoke all on public.writing_prompts from anon,authenticated;
grant select on public.writing_prompts to authenticated;
grant all on public.writing_prompts to service_role;
create policy writing_prompts_read on public.writing_prompts for select to authenticated
  using(state='verified' and valid_until>=current_date and verified_at<=now());

alter table public.writing_drafts add column studio jsonb not null default '{}'::jsonb
  check(jsonb_typeof(studio)='object' and octet_length(studio::text)<=50000);
alter table public.writing_drafts add column prompt_id uuid references public.writing_prompts(id);
create index writing_drafts_prompt on public.writing_drafts(prompt_id);
alter table public.writing_drafts drop constraint writing_drafts_kind_check;
alter table public.writing_drafts add constraint writing_drafts_kind_check check(kind in
 ('essay','sop','personal_statement','cv','supplemental','motivation','scholarship','research','activities','email','interview'));

-- Receipts contain a digest, never an additional copy of student writing.
create table public.writing_save_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  draft_id uuid not null,
  input_hash text not null,
  saved_version integer not null,
  created_at timestamptz not null default now(),
  primary key(user_id,request_id),
  foreign key(draft_id,user_id) references public.writing_drafts(id,user_id) on delete cascade
);
create index writing_receipts_draft on public.writing_save_receipts(draft_id,user_id);
create index writing_receipts_rate on public.writing_save_receipts(user_id,created_at desc);
alter table public.writing_save_receipts enable row level security;
revoke all on public.writing_save_receipts from anon,authenticated;
grant all on public.writing_save_receipts to service_role;
-- Deliberate bounded command authority: authenticated identity is rechecked here;
-- no browser role can directly mutate drafts, immutable history or receipts.
create function public.writing_studio_save(p_input jsonb)
returns public.writing_drafts language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); d public.writing_drafts; receipt public.writing_save_receipts;
  ident uuid:=(p_input->>'id')::uuid; req uuid:=(p_input->>'requestId')::uuid;
  expected integer:=(p_input->>'version')::integer;
  app uuid:=(p_input->>'applicationId')::uuid;
  prompt_ident uuid:=(p_input->>'promptId')::uuid;
  digest text:=encode(sha256(convert_to(p_input::text,'UTF8')),'hex');
  checkpoint boolean:=coalesce((p_input->>'checkpoint')::boolean,false);
begin
  if u is null or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
  if ident is null or req is null or expected is null or expected<0
    or jsonb_typeof(p_input)<>'object' or p_input->>'title' is null
    or p_input->>'kind' is null or p_input->>'content' is null
    or p_input->>'prompt' is null or p_input->'studio' is null
    or jsonb_typeof(p_input->'rubric') is distinct from 'object'
    or octet_length((p_input->'rubric')::text)>2000 then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,21));
  select * into receipt from public.writing_save_receipts where user_id=u and request_id=req;
  if found then
    if receipt.input_hash<>digest or receipt.draft_id<>ident then raise check_violation; end if;
    select * into d from public.writing_drafts where id=ident and user_id=u;
    -- A replay must never acknowledge newer remote content as this local write.
    if not found or d.version<>receipt.saved_version then raise serialization_failure; end if;
    return d;
  end if;
  if (select count(*) from public.writing_save_receipts where user_id=u and created_at>now()-interval '1 hour')>=240
    or (select count(*) from public.writing_save_receipts where user_id=u)>=10000 then
    raise exception 'Save quota reached' using errcode='P0001'; end if;
  if app is not null and not exists(select 1 from public.applications where id=app and user_id=u and archived_at is null) then raise insufficient_privilege; end if;
  if prompt_ident is not null and app is not null and exists(select 1 from public.writing_prompts p join public.applications a on a.id=app and a.user_id=u where p.id=prompt_ident and (p.cycle<>a.cycle_year or (p.program_id is not null and p.program_id<>a.program_id))) then raise check_violation; end if;
  if prompt_ident is not null and not exists(select 1 from public.writing_prompts where id=prompt_ident
    and state='verified' and valid_until>=current_date and verified_at<=now())
    and not exists(select 1 from public.writing_drafts existing where existing.id=ident and existing.user_id=u and existing.prompt_id=prompt_ident)
    then raise check_violation; end if;
  select * into d from public.writing_drafts where id=ident for update;
  if found then
    if d.user_id<>u then raise insufficient_privilege; end if;
    if d.version is distinct from expected then raise serialization_failure; end if;
    update public.writing_drafts set title=p_input->>'title',kind=p_input->>'kind',content=p_input->>'content',
      prompt=p_input->>'prompt',word_limit=(p_input->>'wordLimit')::integer,rubric=p_input->'rubric',
      studio=p_input->'studio',application_id=app,prompt_id=prompt_ident,version=version+1,updated_at=now()
      where id=ident returning * into d;
  else
    if expected<>0 then raise serialization_failure; end if;
    if (select count(*) from public.writing_drafts where user_id=u)>=100 then raise exception 'Project quota reached' using errcode='P0001'; end if;
    insert into public.writing_drafts(id,user_id,title,kind,content,prompt,word_limit,rubric,studio,application_id,prompt_id)
      values(ident,u,p_input->>'title',p_input->>'kind',p_input->>'content',p_input->>'prompt',
      (p_input->>'wordLimit')::integer,p_input->'rubric',p_input->'studio',app,prompt_ident) returning * into d;
    checkpoint:=true;
  end if;
  if checkpoint then
    if (select count(*) from public.writing_versions where draft_id=ident)>=200 then raise exception 'Checkpoint quota reached' using errcode='P0001'; end if;
    insert into public.writing_versions(draft_id,user_id,version,snapshot,request_id)
      values(d.id,u,d.version,to_jsonb(d)-'user_id',req);
  end if;
  insert into public.writing_save_receipts(user_id,request_id,draft_id,input_hash,saved_version)
    values(u,req,d.id,digest,d.version);
  return d;
end; $$;
revoke all on function public.writing_studio_save(jsonb) from public,anon;
grant execute on function public.writing_studio_save(jsonb) to authenticated;
commit;
