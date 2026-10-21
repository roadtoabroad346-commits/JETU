begin;
-- Only the privileged account-deletion worker may create a deletion marker.
grant select, insert on public.student_account_deletions to service_role;
commit;
