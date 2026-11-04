begin;
create or replace function public.catalog_editor_command(p_command jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_role text:=jetu_private.catalog_editor_role();
  v_entity public.catalog_entities%rowtype;
  v_claim public.source_claims%rowtype;
  v_source public.official_sources%rowtype;
  v_action text:=p_command->>'action';
  v_note text:=btrim(p_command->>'note');
  v_before jsonb; v_after jsonb; v_run bigint;
begin
  if auth.uid() is null or coalesce(v_role,'') not in ('reviewer','admin') then
    raise exception using errcode='42501',message='catalog reviewer membership required';
  end if;
  if v_action is null or v_action not in ('review_claim','reject_claim','publish','unpublish')
     or v_note is null or length(v_note) not between 10 and 1000
     or coalesce((p_command->>'attested')::boolean,false) is not true then
    raise exception using errcode='22023',message='explicit review attestation and note required';
  end if;
  -- Serialize review/publication graph changes across reviewers.
  perform pg_catalog.pg_advisory_xact_lock(284028);
  select * into v_entity from public.catalog_entities where id=(p_command->>'entityId')::bigint for update;
  if not found then raise exception using errcode='P0002',message='catalog entity missing'; end if;
  if v_entity.revision is distinct from (p_command->>'expectedRevision')::bigint then
    raise exception using errcode='40001',message='catalog revision conflict';
  end if;
  v_before:=to_jsonb(v_entity)||jsonb_build_object('record',jetu_private.catalog_record(v_entity.id,v_entity.entity_type));

  if v_action in ('review_claim','reject_claim') then
    select * into v_claim from public.source_claims where id=(p_command->>'claimId')::bigint and catalog_entity_id=v_entity.id for update;
    if not found then raise exception using errcode='P0002',message='source claim missing'; end if;
    if v_claim.content_hash is distinct from p_command->>'expectedHash'
       or v_claim.verification_state_code is distinct from p_command->>'expectedState' then
      raise exception using errcode='40001',message='source claim changed';
    end if;
    select * into strict v_source from public.official_sources where id=v_claim.source_id for update;
    v_before:=v_before||jsonb_build_object('claim',to_jsonb(v_claim));
    if v_action='review_claim' then
      if not v_source.is_active or v_source.last_checked_at>now()+interval '5 minutes'
        or (v_source.effective_until is not null and v_source.effective_until<current_date)
        or (v_claim.effective_until is not null and v_claim.effective_until<current_date) then
        raise exception using errcode='23514',message='source or claim is inactive or expired';
      end if;
      insert into public.verification_runs(source_id,outcome,started_at,completed_at,reviewer_id,notes)
      values(v_source.id,'verified',now(),now(),auth.uid(),v_note) returning id into v_run;
      perform public.review_source_claim(v_claim.id,v_run);
    else
      -- Rejecting evidence must never leave an old verified public record behind.
      if v_entity.publication_status_code='published' then
        if exists(select 1 from public.catalog_entities child where child.publication_status_code='published'
          and v_entity.id=any(jetu_private.catalog_parents(child.id))) then
          raise exception using errcode='23514',message='unpublish dependent records before rejecting parent evidence';
        end if;
        update public.catalog_entities set publication_status_code='draft',verification_state_code='needs_review' where id=v_entity.id;
      end if;
      update public.source_claims set verification_state_code='rejected' where id=v_claim.id;
    end if;
    update public.catalog_entities set revision=revision+1 where id=v_entity.id;
  elsif v_action='publish' then
    if p_command->>'expectedRecordHash' is distinct from md5(coalesce(jetu_private.catalog_record(v_entity.id,v_entity.entity_type),'null'::jsonb)::text) then
      raise exception using errcode='40001',message='catalog record changed';
    end if;
    if jetu_private.catalog_record(v_entity.id,v_entity.entity_type) is null then
      raise exception using errcode='23514',message='unsupported editorial entity';
    end if;
    if exists(select 1 from public.source_claims where catalog_entity_id=v_entity.id and verification_state_code not in ('verified','rejected')) then
      raise exception using errcode='23514',message='all claims must be resolved before publication';
    end if;
    if exists(select 1 from public.catalog_entities parent where parent.id=any(jetu_private.catalog_parents(v_entity.id))
      and (parent.publication_status_code<>'published' or parent.verification_state_code<>'verified')) then
      raise exception using errcode='23514',message='publish reviewed parent records first';
    end if;
    if not exists(select 1 from public.source_claims sc join public.official_sources os on os.id=sc.source_id
      where sc.catalog_entity_id=v_entity.id and sc.verification_state_code='verified' and os.is_active
      and os.last_checked_at>=now()-interval '180 days'
      and (sc.effective_from is null or sc.effective_from<=current_date)
      and (sc.effective_until is null or sc.effective_until>=current_date)) then
      raise exception using errcode='23514',message='current verified official evidence required';
    end if;
    perform public.publish_catalog_entity(v_entity.id,now());
  else
    -- Do not silently orphan published child records.
    if exists(select 1 from public.catalog_entities child where child.publication_status_code='published'
      and v_entity.id=any(jetu_private.catalog_parents(child.id))) then
      raise exception using errcode='23514',message='unpublish dependent records first';
    end if;
    update public.catalog_entities set publication_status_code='draft',verification_state_code='needs_review' where id=v_entity.id;
  end if;
  select to_jsonb(e)||jsonb_build_object('record',jetu_private.catalog_record(e.id,e.entity_type)) into v_after
    from public.catalog_entities e where id=v_entity.id;
  if v_claim.id is not null then
    select v_after||jsonb_build_object('claim',to_jsonb(sc)) into v_after from public.source_claims sc where id=v_claim.id;
  end if;
  insert into public.catalog_editor_events(entity_id,claim_id,actor_id,action,note,before_snapshot,after_snapshot)
  values(v_entity.id,v_claim.id,auth.uid(),v_action,v_note,v_before,v_after);
  return jsonb_build_object('entityId',v_entity.id,'revision',(v_after->>'revision')::bigint);
end;
$$;
revoke all on function public.catalog_editor_command(jsonb) from public,anon;
grant execute on function public.catalog_editor_command(jsonb) to authenticated;

commit;
