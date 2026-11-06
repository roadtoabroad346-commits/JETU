-- Data API callers can bypass Next/Zod. Enforce CAS, human attestation and
-- structured feedback at the database boundary as well as in the web API.
begin;
create or replace function public.mentor_command(p_input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); op text:=p_input->>'op'; item jsonb; score jsonb;
 criterion text; actual_version bigint; anchor jsonb:=p_input->'anchor';
begin
 if u is null or not exists(select 1 from auth.users where id=u) or jetu_private.is_account_deletion_pending() then raise insufficient_privilege; end if;
 if jsonb_typeof(p_input) is distinct from 'object' or octet_length(p_input::text)>60000 then raise check_violation; end if;
 if op in ('verify','transition','resolve','moderate') then
   if jsonb_typeof(p_input->'revision') is distinct from 'number' then raise check_violation; end if;
   if (p_input->>'revision')::numeric not between 1 and 2147483647 or trunc((p_input->>'revision')::numeric)<>(p_input->>'revision')::numeric then raise check_violation; end if;
 end if;
 if op in ('verify','clearance','case_suspend') and p_input->'attest' is distinct from 'true'::jsonb then raise check_violation; end if;
 if op='comment' and anchor is not null and anchor<>'null'::jsonb then
   if jsonb_typeof(anchor) is distinct from 'object'
     or jsonb_typeof(anchor->'start') is distinct from 'number'
     or jsonb_typeof(anchor->'end') is distinct from 'number'
     or jsonb_typeof(anchor->'quote') is distinct from 'string' then raise check_violation; end if;
   if (anchor->>'start')::numeric not between 0 and 60000
     or (anchor->>'end')::numeric not between 1 and 60000
     or (anchor->>'end')::numeric<=(anchor->>'start')::numeric
     or trunc((anchor->>'start')::numeric)<>(anchor->>'start')::numeric
     or trunc((anchor->>'end')::numeric)<>(anchor->>'end')::numeric
     or length(anchor->>'quote') not between 1 and 1000 then raise check_violation; end if;
 end if;
 if op='review' then
   if jsonb_typeof(p_input->'rubric') is distinct from 'object'
     or jsonb_typeof(p_input->'actions') is distinct from 'array' then raise check_violation; end if;
   if (select count(*) from jsonb_object_keys(p_input->'rubric'))<>7 or jsonb_array_length(p_input->'actions')>10 then raise check_violation; end if;
   foreach criterion in array array['clarity','structure','specificity','evidence','voice','prompt_fit','grammar'] loop
     score:=p_input->'rubric'->criterion;
     if jsonb_typeof(score) is distinct from 'number' then raise check_violation; end if;
     if score::numeric not between 1 and 5 or trunc(score::numeric)<>score::numeric then raise check_violation; end if;
   end loop;
   for item in select jsonb_array_elements(p_input->'actions') loop
     if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'text') is distinct from 'string'
       or not (item ? 'source') then raise check_violation; end if;
     if length(btrim(item->>'text')) not between 3 and 500 or not jetu_private.mentor_safe_text(item->>'text') then raise check_violation; end if;
     if item->'source'<>'null'::jsonb and (jsonb_typeof(item->'source') is distinct from 'string' or length(item->>'source')>2048 or item->>'source' !~ '^https://[^[:space:]@]+$') then raise check_violation; end if;
   end loop;
 end if;
 if op='create' then
   if jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items')>10 then raise check_violation; end if;
   perform pg_advisory_xact_lock(220022);
   -- A retry still returns the original receipt after application edits; the
   -- existing core verifies the complete original payload digest.
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
commit;
