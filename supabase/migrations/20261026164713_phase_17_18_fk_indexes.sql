-- Cover composite foreign keys used by roadmap/application deletes and joins.
begin;

create index roadmap_targets_catalog_fk_idx
  on public.roadmap_targets(catalog_entity_id);
create index roadmap_targets_owner_fk_idx
  on public.roadmap_targets(roadmap_id,user_id);
create index roadmap_milestones_owner_fk_idx
  on public.roadmap_milestones(roadmap_id,user_id);
create index roadmap_milestones_target_fk_idx
  on public.roadmap_milestones(target_id,roadmap_id,user_id)
  where target_id is not null;
create index roadmap_tasks_owner_fk_idx
  on public.roadmap_tasks(roadmap_id,user_id);
create index roadmap_tasks_milestone_fk_idx
  on public.roadmap_tasks(milestone_id,roadmap_id,user_id)
  where milestone_id is not null;
create index roadmap_tasks_target_owner_fk_idx
  on public.roadmap_tasks(target_id,roadmap_id,user_id)
  where target_id is not null;
create index roadmap_dependencies_owner_fk_idx
  on public.roadmap_task_dependencies(roadmap_id,user_id);
create index roadmap_dependencies_task_owner_fk_idx
  on public.roadmap_task_dependencies(task_id,roadmap_id,user_id);
create index roadmap_dependencies_prerequisite_owner_fk_idx
  on public.roadmap_task_dependencies(depends_on_task_id,roadmap_id,user_id);
create index roadmap_runs_owner_fk_idx
  on public.roadmap_generation_runs(roadmap_id,user_id);
create index roadmap_events_owner_fk_idx
  on public.roadmap_task_events(roadmap_id,user_id);
create index roadmap_events_task_owner_fk_idx
  on public.roadmap_task_events(task_id,roadmap_id,user_id);
create index checklist_roadmap_task_owner_fk_idx
  on public.application_checklist_items(roadmap_task_id,user_id)
  where roadmap_task_id is not null;
create index applications_fee_currency_fk_idx
  on public.applications(application_fee_currency)
  where application_fee_currency is not null;

commit;
