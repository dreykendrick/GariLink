reset role;
-- Explicit disposable policy, not a production retention/legal decision.
-- Entire harness rolls this back. Never execute this file on hosted data.
update garilink_private.identity_evidence_policies
  set approved=true,retention_seconds=7200 where policy_version=1;
update garilink_private.identity_collection_control set enabled=true where singleton;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);
select set_config('test.evidence.case',public.garilink_identity_status()->>'caseId',true);
select set_config('test.evidence.reservation',public.garilink_identity_reserve_evidence(
  current_setting('test.evidence.case')::uuid,1,1,'82000000-0000-4000-8000-000000000002','image/png',100)::text,true);
select pg_temp.assert_true(public.garilink_identity_reserve_evidence(
  current_setting('test.evidence.case')::uuid,1,1,'82000000-0000-4000-8000-000000000002','image/png',100)
  =current_setting('test.evidence.reservation')::jsonb,'exact reservation retry');
do $$ begin
  begin perform public.garilink_identity_reserve_evidence(current_setting('test.evidence.case')::uuid,
    null,1,'82000000-0000-4000-8000-000000000003','image/png',100);
    raise exception 'Expected null revision denial'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_identity_reserve_evidence(current_setting('test.evidence.case')::uuid,
    1,1,'82000000-0000-4000-8000-000000000002','image/png',101);
    raise exception 'Expected conflicting retry denial'; exception when sqlstate 'PT409' then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
do $$ begin
  begin perform public.garilink_identity_reserve_evidence(current_setting('test.evidence.case')::uuid,
    1,1,'82000000-0000-4000-8000-000000000004','image/png',100);
    raise exception 'Expected cross-account denial'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update garilink_private.identity_collection_control set enabled=false where singleton;
select pg_temp.assert_true(not garilink_private.identity_collection_enabled(),'collection disabled by default');
select pg_temp.assert_true(not has_function_privilege('service_role',
  'garilink_private.identity_record_inspection(uuid,text,text,integer,text,text,text,text,timestamptz,timestamptz)','EXECUTE'),
  'service role cannot forge inspection');
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'garilink_private.identity_finalize_evidence(uuid,uuid,integer,uuid)','EXECUTE'),
  'applicant cannot finalize evidence');
select pg_temp.assert_true(not has_table_privilege('authenticated',
  'garilink_private.identity_content_inspections','SELECT,INSERT,UPDATE,DELETE'),'inspection ledger is private');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);
do $$ begin
  begin perform public.garilink_identity_reserve_evidence(current_setting('test.lifecycle.case')::uuid,1,1,
    '82000000-0000-4000-8000-000000000001','image/png',100);
    raise exception 'Expected disabled collection denial'; exception when insufficient_privilege then null; end;
end $$;
reset role;
