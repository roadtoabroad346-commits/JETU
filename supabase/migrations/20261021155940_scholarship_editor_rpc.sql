-- Authenticated editor RPCs enforce membership in PostgreSQL; no service key is needed by the app.
begin;
create function jetu_private.scholarship_editor_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.scholarship_editor_memberships where user_id=(select auth.uid());
$$;
revoke all on function jetu_private.scholarship_editor_role() from public,anon,authenticated;

create function public.scholarship_editor_preview(p_slug text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(jetu_private.scholarship_editor_role(),'') not in ('editor','reviewer','admin')
     or auth.uid() is null then
    raise exception using errcode='42501',message='scholarship editor membership required';
  end if;
  return exists(select 1 from public.scholarships where slug=p_slug);
end;
$$;

create function public.scholarship_editor_create_draft(p_bundle jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(jetu_private.scholarship_editor_role(),'') not in ('editor','reviewer','admin')
     or auth.uid() is null then
    raise exception using errcode='42501',message='scholarship editor membership required';
  end if;
  return public.scholarship_create_draft(p_bundle,auth.uid());
end;
$$;

create function public.scholarship_editor_transition(p_id bigint,p_action text,p_note text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(jetu_private.scholarship_editor_role(),'') not in ('reviewer','admin')
     or auth.uid() is null then
    raise exception using errcode='42501',message='scholarship reviewer membership required';
  end if;
  return public.scholarship_transition(p_id,p_action,auth.uid(),p_note);
end;
$$;

create function public.scholarship_editor_list()
returns table(id bigint,slug text,title text,publication_status_code text,verification_state_code text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(jetu_private.scholarship_editor_role(),'') not in ('editor','reviewer','admin')
     or auth.uid() is null then
    raise exception using errcode='42501',message='scholarship editor membership required';
  end if;
  return query select s.id,s.slug,s.title,ce.publication_status_code,ce.verification_state_code
    from public.scholarships s join public.catalog_entities ce on ce.id=s.id
    order by s.id desc limit 100;
end;
$$;

revoke all on function public.scholarship_editor_preview(text) from public,anon,authenticated;
revoke all on function public.scholarship_editor_create_draft(jsonb) from public,anon,authenticated;
revoke all on function public.scholarship_editor_transition(bigint,text,text) from public,anon,authenticated;
revoke all on function public.scholarship_editor_list() from public,anon,authenticated;
grant execute on function public.scholarship_editor_preview(text),
  public.scholarship_editor_create_draft(jsonb),
  public.scholarship_editor_transition(bigint,text,text),
  public.scholarship_editor_list() to authenticated;
commit;
