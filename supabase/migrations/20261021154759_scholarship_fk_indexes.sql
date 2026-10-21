-- Phase 13 follow-up: cover foreign keys found by the development advisor.
begin;
create index scholarship_application_claim_idx on public.scholarship_application_details(source_claim_id,scholarship_id);
create index scholarship_document_claim_idx on public.scholarship_document_requirements(source_claim_id,scholarship_cycle_id);
create index scholarship_membership_granter_idx on public.scholarship_editor_memberships(granted_by);
create index scholarship_note_updater_idx on public.scholarship_editor_notes(updated_by);
create index scholarship_event_actor_idx on public.scholarship_editorial_events(actor_id);
commit;
