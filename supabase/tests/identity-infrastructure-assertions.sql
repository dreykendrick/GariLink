reset role;
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'garilink_private.identity_worker_commit(jsonb)','EXECUTE'),'applicant cannot attest or finalize');
select pg_temp.assert_true(not has_function_privilege('service_role',
  'garilink_private.identity_worker_commit(jsonb)','EXECUTE'),'service role not a processor');
select pg_temp.assert_true(has_function_privilege('garilink_evidence_worker',
  'garilink_private.identity_worker_commit(jsonb)','EXECUTE'),'trusted processor has narrow commit capability');
select pg_temp.assert_true(not has_function_privilege('garilink_evidence_worker',
  'garilink_private.identity_record_inspection(uuid,text,text,integer,text,text,text,text,timestamptz,timestamptz)','EXECUTE'),
  'processor cannot bypass commit validation');
select pg_temp.assert_true(not has_table_privilege('garilink_evidence_worker',
  'garilink_private.verification_documents','UPDATE'),'processor cannot directly mutate document');
select pg_temp.assert_true(not has_table_privilege('garilink_evidence_sealer','storage.objects','UPDATE,DELETE'),
  'sealer has no overwrite/delete privilege');
select pg_temp.assert_true(not has_table_privilege('garilink_evidence_reader','storage.objects','INSERT,UPDATE,DELETE'),
  'review delivery is read-only');
select pg_temp.assert_true(not has_function_privilege('anon',
  'public.garilink_identity_reviewer_sealed(uuid,uuid)','EXECUTE'),'anonymous reviewer proxy denied');
select pg_temp.assert_true(not garilink_private.identity_collection_enabled(),'collection stays disabled after fixtures');
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'public.garilink_identity_proxy_resolve(uuid,uuid)','EXECUTE'),'reviewer cannot obtain private Storage path');
select pg_temp.assert_true(has_function_privilege('garilink_evidence_reader',
  'public.garilink_identity_proxy_resolve(uuid,uuid)','EXECUTE'),'proxy can resolve authorized access only');
