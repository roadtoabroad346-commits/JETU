-- Supabase PostgreSQL ships pg_cron. Embedded PostgreSQL lacks this provider extension.
-- Expiry RLS and request-time cleanup remain enforced even when scheduling is unavailable.
do $schedule$
begin
  if exists(select 1 from pg_available_extensions where name='pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('jetu-coach-retention','17 * * * *','select public.coach_prune();');
  end if;
end
$schedule$;
