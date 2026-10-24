-- A student may save only a scholarship already visible through catalog RLS.
begin;
alter policy scholarship_save_own on public.student_scholarship_saves
  using (user_id=(select auth.uid()))
  with check (
    user_id=(select auth.uid())
    and exists(select 1 from public.scholarships s where s.id=scholarship_id)
  );
commit;
