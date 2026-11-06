-- Reports belong to the requesting student. A direct Auth FK must agree with
-- request-owned erasure; otherwise PostgreSQL's immediate FK check can run before
-- the separate Auth -> request -> report cascade and block deletion.
begin;
alter table public.mentor_reports drop constraint mentor_reports_reporter_id_fkey;
alter table public.mentor_reports add constraint mentor_reports_reporter_id_fkey
 foreign key(reporter_id) references auth.users(id) on delete cascade;
commit;
