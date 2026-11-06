-- Explicitly run only against the authorized Jetuu development project after QA.
-- Not part of migrations: restoring a test copy must not activate a scheduler.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('jetu-deadlines','* * * * *','select notification_private.run();');
-- Disable without deleting history:
-- select cron.unschedule('jetu-deadlines');
