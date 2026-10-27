-- Rollback-only synthetic identities. SQL role probes are not hosted Auth tests.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
select ok((select not public from storage.buckets where id='student-vault'),'private bucket');
select ok((select file_size_limit=3145728 from storage.buckets where id='student-vault'),'bounded storage');
select ok((select bool_and(relrowsecurity) from pg_class where oid in ('public.vault_documents'::regclass,'public.vault_versions'::regclass,'public.vault_links'::regclass,'public.writing_drafts'::regclass,'public.writing_versions'::regclass,'public.recommendation_requests'::regclass)),'all new metadata has RLS');
select ok(not has_table_privilege('authenticated','public.vault_versions','UPDATE'),'client cannot claim clean scan');
select ok(not has_function_privilege('authenticated','public.vault_scan_result(uuid,text,boolean,text)','EXECUTE'),'scanner RPC unavailable to students');
select ok(not has_function_privilege('anon','public.vault_reserve(uuid,text,text,text,uuid,text,text,integer,text,uuid,uuid)','EXECUTE'),'anonymous reservation denied');
select ok(not has_column_privilege('authenticated','public.recommendation_requests','token_hash','SELECT'),'invite digest private');
select ok(not has_column_privilege('authenticated','public.recommendation_requests','letter_document_id','SELECT'),'letter identity private');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('19190000-0000-0000-0000-00000000000'||n)::uuid,'authenticated','authenticated','phase19-'||n||'@example.invalid','',now(),'{}','{}',now(),now() from generate_series(1,3) n;
create temporary table vault_test_values(key text primary key,value text);
grant all on vault_test_values to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','19190000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.vault_reserve(null,'essay','Essay.txt','',null,'txt','text/plain',5,repeat('a',64),'19191111-0000-0000-0000-000000000001')$$,'owner reserves immutable upload');
insert into vault_test_values select 'doc',document_id::text from public.vault_versions where id='19191111-0000-0000-0000-000000000001';
select lives_ok($$select public.vault_reserve(null,'essay','Essay.txt','',null,'txt','text/plain',5,repeat('a',64),'19191111-0000-0000-0000-000000000001')$$,'same reservation idempotent');
select throws_ok($$select public.vault_reserve(null,'essay','Essay.txt','',null,'txt','text/plain',6,repeat('a',64),'19191111-0000-0000-0000-000000000001')$$,'23514',null,'mismatched idempotency denied');
select throws_ok($$select public.vault_reserve(null,'identity','Passport.pdf','',null,'pdf','application/pdf',5,repeat('a',64),'19191111-0000-0000-0000-000000000002')$$,'42501',null,'no unnecessary identity collection');
select throws_ok($$select public.vault_reserve(null,'essay','Essay.exe','',null,'exe','application/octet-stream',5,repeat('a',64),'19191111-0000-0000-0000-000000000002')$$,'23514',null,'unsupported format denied');
select throws_ok($$select public.vault_reserve(null,'essay','Essay.pdf','',null,'pdf','application/pdf',3145729,repeat('a',64),'19191111-0000-0000-0000-000000000002')$$,'23514',null,'oversize denied');
select throws_ok($$select public.vault_reserve(null,'essay','<script>','',null,'txt','text/plain',5,repeat('a',64),'19191111-0000-0000-0000-000000000002')$$,'23514',null,'unsafe display metadata denied');
select throws_ok($$select public.vault_finish('19191111-0000-0000-0000-000000000001',false)$$,'23514',null,'missing object cannot finish');
select lives_ok($$insert into storage.objects(bucket_id,name) select 'student-vault',object_path from public.vault_versions where id='19191111-0000-0000-0000-000000000001'$$,'constrained exact object insert');
select throws_ok($$insert into storage.objects(bucket_id,name) values('student-vault','private/student/19190000-0000-0000-0000-000000000001/forged/path')$$,'42501',null,'arbitrary path denied');
select lives_ok($$select public.vault_finish('19191111-0000-0000-0000-000000000001',false)$$,'uploaded object quarantined');
select is((select state from public.vault_versions where id='19191111-0000-0000-0000-000000000001'),'quarantined','no upload promotion');
select set_config('storage.operation','object.get_authenticated',true);
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),0,'quarantine unreadable even by owner');
select throws_ok($$select public.vault_scan_result('19191111-0000-0000-0000-000000000001',repeat('a',64),true,'fake')$$,'42501',null,'forged verdict denied');
select lives_ok($$select public.writing_save('19192222-0000-0000-0000-000000000001',0,'Essay','essay','Әлем hello','My prompt',100,'{}',null,'19193333-0000-0000-0000-000000000001')$$,'writing persisted');
select lives_ok($$select public.writing_save('19192222-0000-0000-0000-000000000001',0,'Essay','essay','Әлем hello','My prompt',100,'{}',null,'19193333-0000-0000-0000-000000000001')$$,'writing retry idempotent');
select throws_ok($$select public.writing_save('19192222-0000-0000-0000-000000000001',0,'Essay','essay','different','My prompt',100,'{}',null,'19193333-0000-0000-0000-000000000001')$$,'23514',null,'replayed token cannot change content');
select lives_ok($$select public.writing_save('19192222-0000-0000-0000-000000000001',1,'Essay','essay','Revision two','My prompt',100,'{}',null,'19193333-0000-0000-0000-000000000002')$$,'new revision stored');
select throws_ok($$select public.writing_save('19192222-0000-0000-0000-000000000001',1,'Essay','essay','Lost update','My prompt',100,'{}',null,'19193333-0000-0000-0000-000000000003')$$,'40001',null,'stale save conflicts');
select is((select count(*)::integer from public.writing_versions),2,'history immutable across conflict');
select throws_ok($$select public.writing_save('19192222-0000-0000-0000-000000000001',null,'Essay','essay','Bypass CAS','My prompt',100,'{}',null,'19193333-0000-0000-0000-000000000003')$$,'40001',null,'null CAS cannot bypass concurrency');
select throws_ok($$select public.vault_reserve(null,'cv','Essay.txt','',null,'txt','text/plain',5,repeat('a',64),'19191111-0000-0000-0000-000000000001')$$,'23514',null,'idempotency binds category and purpose');
select set_config('request.jwt.claim.sub','19190000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from public.vault_documents),0,'A metadata invisible to B');
select is((select count(*)::integer from public.vault_versions),0,'A versions invisible to B');
select is((select count(*)::integer from public.writing_drafts),0,'A drafts invisible to B');
select is((select count(*)::integer from public.writing_versions),0,'A history invisible to B');
select throws_ok($$select public.vault_finish('19191111-0000-0000-0000-000000000001',false)$$,'42501',null,'swapped version denied');
select throws_ok($$select public.vault_manage((select value::uuid from vault_test_values where key='doc'),'delete')$$,'42501',null,'cross-owner deletion denied');
select throws_ok($$select public.writing_save('19192222-0000-0000-0000-000000000001',2,'Essay','essay','stolen','',null,'{}',null,'19193333-0000-0000-0000-000000000004')$$,'42501',null,'cross-owner draft edit denied');
reset role;
select throws_ok($$select public.vault_scan_result('19191111-0000-0000-0000-000000000001',repeat('b',64),true,'test scanner')$$,'23514',null,'scanner hash mismatch denied');
select lives_ok($$select public.vault_scan_result('19191111-0000-0000-0000-000000000001',repeat('a',64),true,'test scanner - synthetic role test only')$$,'trusted scan transition');
set local role authenticated;
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),0,'B cannot read available A blob');
select set_config('request.jwt.claim.sub','19190000-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),1,'owner authenticated download permitted');
select set_config('storage.operation','object.sign',true);
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),0,'reusable signed URL generation denied');
select set_config('storage.operation','object.list',true);
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),0,'direct bucket listing denied');
select set_config('storage.operation','object.get_authenticated',true);
select lives_ok($$select public.vault_manage((select value::uuid from vault_test_values where key='doc'),'archive')$$,'archive persisted');
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),0,'archive revokes fresh downloads');
select lives_ok($$select public.vault_manage((select value::uuid from vault_test_values where key='doc'),'restore')$$,'restore persisted');
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),1,'restore restores fresh owner download');
select lives_ok($$select public.vault_manage((select value::uuid from vault_test_values where key='doc'),'delete')$$,'delete persisted');
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),0,'delete denies blob before purge');
select throws_ok($$select public.vault_manage((select value::uuid from vault_test_values where key='doc'),'restore')$$,'42501',null,'deleted document cannot restore');
select lives_ok($$select public.writing_delete('19192222-0000-0000-0000-000000000001',2)$$,'owner deletes draft');
select is((select count(*)::integer from public.writing_versions),0,'draft deletion removes revision content');
reset role;
-- Fill only metadata to two bytes below the hard budget; no real blobs created.
insert into public.vault_documents(id,user_id,category,sensitivity,display_name,expires_at)
select ('19196666-0000-0000-0000-00000000000'||n)::uuid,'19190000-0000-0000-0000-000000000001','essay','personal','Quota fixture',now()+interval '1 day' from generate_series(1,2) n;
insert into public.vault_versions(id,document_id,user_id,sequence,object_path,extension,mime,byte_size,sha256,state,created_at)
select ('19197777-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
  ('19196666-0000-0000-0000-00000000000'||case when n<=20 then 1 else 2 end)::uuid,
  '19190000-0000-0000-0000-000000000001',case when n<=20 then n else n-20 end,
  'private/student/19190000-0000-0000-0000-000000000001/'||'19196666-0000-0000-0000-00000000000'||case when n<=20 then 1 else 2 end||'/'||'19197777-0000-0000-0000-'||lpad(n::text,12,'0')||'/asset.pdf',
  'pdf','application/pdf',2995931+case when n=35 then 8 else 0 end,repeat('a',64),'failed',now()-interval '2 hours'
from generate_series(1,35) n;
set local role authenticated;
select throws_ok($$select public.vault_reserve(null,'essay','Over quota.txt','',null,'txt','text/plain',5,repeat('a',64),'19191111-0000-0000-0000-000000000009')$$,'P0001',null,'pending reservation cannot exceed remaining two byte budget');
reset role;
set local role anon;
select throws_ok('select * from public.vault_documents','42501',null,'anonymous metadata denied');
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),0,'anonymous blob denied');
reset role;
select * from finish();
rollback;
