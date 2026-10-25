begin;
update public.matching_configuration set is_active = false where version = 'matching-v1';
insert into public.matching_configuration(version,weights,is_active)
values ('matching-v2','{"major":20,"country":15,"language":15,"degree":15,"funding":15,"budget":20}',true);
commit;
