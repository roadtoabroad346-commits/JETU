begin;
create index vault_links_document_owner_idx on public.vault_links(document_id,user_id);
-- A redeemed invitation survives refresh without exposing the letter or token digest.
create function public.recommendation_received()
returns table(id uuid,context text,due_date date,expires_at timestamptz,status text)
language sql stable security definer set search_path='' as $$
  select r.id,r.context,r.due_date,r.expires_at,r.status from public.recommendation_requests r
  where r.recommender_id=(select auth.uid()) and not jetu_private.is_account_deletion_pending()
  order by r.created_at desc limit 100;
$$;
revoke all on function public.recommendation_received() from public,anon;
grant execute on function public.recommendation_received() to authenticated;
commit;
