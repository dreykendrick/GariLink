-- Synthetic metadata ONLY, not proof of accepted Storage bytes/scanning.
-- Whole disposable database transaction is rolled back; no immutable history
-- deletion or FK relaxation is used for fixture cleanup.
reset role;
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'garilink_private.identity_assign(uuid,uuid,uuid,timestamptz,boolean)','EXECUTE'),'applicant cannot assign reviewers');
select pg_temp.assert_true(not has_function_privilege('service_role',
  'garilink_private.identity_revoke(uuid,uuid,uuid)','EXECUTE'),'service role cannot invoke trusted revocation');
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'garilink_private.identity_reviewer_authority(uuid,uuid,timestamptz,boolean,uuid)','EXECUTE'),
  'applicant cannot grant reviewer authority');
select pg_temp.assert_true(not has_function_privilege('service_role',
  'garilink_private.identity_reviewer_authority(uuid,uuid,timestamptz,boolean,uuid)','EXECUTE'),
  'service role cannot grant reviewer authority');
select pg_temp.assert_true(not has_table_privilege('authenticated',
  'garilink_private.identity_validation_receipts','INSERT,SELECT,UPDATE,DELETE'),'validation receipts private');
select set_config('test.lifecycle.case',current_setting('test.identity.case')::jsonb->>'caseId',true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);
do $$ begin
  begin perform public.garilink_identity_submit(current_setting('test.lifecycle.case')::uuid,1,1,'81000000-0000-4000-8000-000000000001');
    raise exception 'Expected missing evidence denial'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
insert into garilink_private.verification_documents(id,case_id,version,object_path,mime_type,size_bytes,state,reservation_expires_at,retention_until,reserved_case_revision)
  values('81000000-0000-4000-8000-000000000010',current_setting('test.lifecycle.case')::uuid,1,
  '81000000-0000-4000-8000-000000000011/81000000-0000-4000-8000-000000000012','image/png',100,
  'RESERVED',now()+interval '10 minutes',now()+interval '1 day',1);
set local role authenticated;
do $$ begin
  begin perform public.garilink_identity_submit(current_setting('test.lifecycle.case')::uuid,1,1,'81000000-0000-4000-8000-000000000001');
    raise exception 'Expected missing scanner receipt denial'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
-- SQL-only provenance fixture. This is NOT actual uploaded/scanned content.
insert into garilink_private.identity_sealed_objects(document_id,object_path,sha256)
  values('81000000-0000-4000-8000-000000000010','SYNTHETIC_SQL_SEALED_NOT_STORAGE',repeat('a',64));
select garilink_private.identity_finalize_evidence(
  '81000000-0000-4000-8000-000000000010',
  garilink_private.identity_record_inspection(
    '81000000-0000-4000-8000-000000000010','SYNTHETIC_OBJECT_VERSION','image/png',100,
    repeat('a',64),'SYNTHETIC_SQL_ONLY','SYNTHETIC_SQL_FIXTURE_NOT_A_SCAN','CLEAN',now(),now()+interval '1 hour'),
  1,'81000000-0000-4000-8000-000000000030');
set local role authenticated;
select pg_temp.assert_true(public.garilink_identity_submit(current_setting('test.lifecycle.case')::uuid,1,1,
  '81000000-0000-4000-8000-000000000001')->>'state'='PENDING_REVIEW','validated synthetic case submitted');
select pg_temp.assert_true(public.garilink_identity_submit(current_setting('test.lifecycle.case')::uuid,1,1,
  '81000000-0000-4000-8000-000000000001')->>'revision'='2','exact submit replay');
do $$ begin
  begin perform public.garilink_identity_submit(current_setting('test.lifecycle.case')::uuid,2,1,'81000000-0000-4000-8000-000000000001');
    raise exception 'Expected conflicting submit replay'; exception when sqlstate 'PT409' then null; end;
  begin perform public.garilink_identity_decide(current_setting('test.lifecycle.case')::uuid,2,1,
    '81000000-0000-4000-8000-000000000002','APPROVED','EVIDENCE_ACCEPTED',now()+interval '1 hour');
    raise exception 'Expected self review denial'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
do $$ begin
  begin perform public.garilink_identity_decide(current_setting('test.lifecycle.case')::uuid,2,1,
    '81000000-0000-4000-8000-000000000002','APPROVED','EVIDENCE_ACCEPTED',now()+interval '1 hour');
    raise exception 'Expected unassigned review denial'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  begin perform garilink_private.identity_assign(current_setting('test.lifecycle.case')::uuid,
    '11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',now()+interval '2 hours');
    raise exception 'Expected unqualified reviewer denial'; exception when insufficient_privilege then null; end;
end $$;
select set_config('test.lifecycle.authority_until',(now()+interval '4 hours')::text,true);
select garilink_private.identity_reviewer_authority(
  '11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
  current_setting('test.lifecycle.authority_until')::timestamptz,false,'81000000-0000-4000-8000-000000000020');
select garilink_private.identity_reviewer_authority(
  '11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
  current_setting('test.lifecycle.authority_until')::timestamptz,false,'81000000-0000-4000-8000-000000000020');
select garilink_private.identity_assign(current_setting('test.lifecycle.case')::uuid,
  '11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',now()+interval '2 hours');
set local role authenticated;
select pg_temp.assert_true(public.garilink_identity_decide(current_setting('test.lifecycle.case')::uuid,2,1,
  '81000000-0000-4000-8000-000000000002','APPROVED','EVIDENCE_ACCEPTED',now()+interval '1 hour')->>'state'='APPROVED','scoped approval');
select pg_temp.assert_true(public.garilink_identity_decide(current_setting('test.lifecycle.case')::uuid,2,1,
  '81000000-0000-4000-8000-000000000002','APPROVED','EVIDENCE_ACCEPTED',now()+interval '1 hour')->>'revision'='3','decision exact replay');
do $$ begin
  begin perform public.garilink_identity_decide(current_setting('test.lifecycle.case')::uuid,2,1,
    '81000000-0000-4000-8000-000000000003','REJECTED','EVIDENCE_MISMATCH');
    raise exception 'Expected conflicting decision denial'; exception when sqlstate 'PT409' then null; end;
end $$;
reset role;
select pg_temp.assert_true((select count(*)=1 from garilink_private.identity_reviewer_authority_events
  where reviewer_id='11111111-1111-4111-8111-111111111111'),'authority retry is idempotent');
do $$ begin
  begin perform garilink_private.identity_reviewer_authority(
    '11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
    null,true,'81000000-0000-4000-8000-000000000020');
    raise exception 'Expected conflicting authority retry'; exception when sqlstate 'PT409' then null; end;
end $$;
select pg_temp.assert_true(garilink_private.identity_eligibility('44444444-4444-4444-8444-444444444444',
  current_setting('test.lifecycle.case')::uuid,now(),now()+interval '30 minutes')->>'identityValid'='true','valid identity distinct from inactive policy');
select pg_temp.assert_true(garilink_private.identity_eligibility('44444444-4444-4444-8444-444444444444',
  current_setting('test.lifecycle.case')::uuid,now(),now()+interval '2 hours')->>'reasonCode'='EXPIRED','entire action period protected');
select pg_temp.assert_true(garilink_private.identity_eligibility('11111111-1111-4111-8111-111111111111',
  current_setting('test.lifecycle.case')::uuid,now(),now())->>'reasonCode'='WRONG_SUBJECT','wrong subject denied');
select garilink_private.identity_revoke(current_setting('test.lifecycle.case')::uuid,
  '22222222-2222-4222-8222-222222222222','81000000-0000-4000-8000-000000000004');
select pg_temp.assert_true(garilink_private.identity_eligibility('44444444-4444-4444-8444-444444444444',
  current_setting('test.lifecycle.case')::uuid,now(),now())->>'reasonCode'='REVOKED','revocation immediately denies');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);
select pg_temp.assert_true(public.garilink_identity_create_case(
  '{"requestId":"81000000-0000-4000-8000-000000000005","policyVersion":1}')->>'state'='DRAFT','new version after revocation');
reset role;
select pg_temp.assert_true((select count(*)=2 from garilink_private.verification_decisions d
  where d.case_id=current_setting('test.lifecycle.case')::uuid),'immutable approval and revocation retained');
