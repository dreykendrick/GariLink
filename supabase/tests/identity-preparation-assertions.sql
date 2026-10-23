-- Prepared disposable SQL only. No documents or reviewer approval seeded.
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.garilink_identity_create_case(jsonb)','EXECUTE'),
  'anonymous identity case creation denied');
select pg_temp.assert_true(not has_sequence_privilege('authenticated',
  'garilink_private.verification_cases_case_sequence_seq','USAGE,SELECT,UPDATE'),
  'private case ordering sequence is not client accessible');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);
select pg_temp.assert_true(public.garilink_identity_status()->>'state'='NOT_STARTED','own identity starts missing');
select set_config('test.identity.case',public.garilink_identity_create_case(
  '{"requestId":"71111111-1111-4111-8111-111111111111","policyVersion":1}')::text,true);
select pg_temp.assert_true(current_setting('test.identity.case')::jsonb->>'state'='DRAFT','email-only applicant creates draft');
select pg_temp.assert_true(public.garilink_identity_create_case(
  '{"requestId":"71111111-1111-4111-8111-111111111111","policyVersion":1}')->>'caseId'
  =current_setting('test.identity.case')::jsonb->>'caseId','exact replay retains case');
select pg_temp.assert_true(not (public.garilink_identity_status()->>'eligible')::boolean
  and not (public.garilink_identity_status()->>'collectionEnabled')::boolean,'no eligibility/upload activation');
select pg_temp.assert_true(not (public.garilink_identity_status() ?| array['subjectId','storagePath','reviewerId','documents','audit']),
  'safe own summary has no private evidence/reviewer fields');
do $$ begin
  begin perform public.garilink_identity_create_case('{"requestId":"71111111-1111-4111-8111-111111111111","policyVersion":2}');
    raise exception 'Expected conflicting replay denied'; exception when sqlstate 'PT409' then null; end;
  begin perform public.garilink_identity_create_case('{"requestId":"72222222-2222-4222-8222-222222222222","policyVersion":1}');
    raise exception 'Expected simultaneous active case denied'; exception when sqlstate 'PT409' then null; end;
  begin perform public.garilink_identity_create_case('{"requestId":"73333333-3333-4333-8333-333333333333","policyVersion":1,"subjectId":"forged"}');
    raise exception 'Expected subject impersonation denied'; exception when invalid_parameter_value then null; end;
  begin update garilink_private.verification_cases set state='APPROVED';
    raise exception 'Expected direct approval denied'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(public.garilink_identity_status()->>'state'='NOT_STARTED','other account cannot retrieve applicant case');
reset role;
select pg_temp.assert_true((select count(*)=1 from garilink_private.verification_audit a
  where a.case_id=(current_setting('test.identity.case')::jsonb->>'caseId')::uuid), 'creation audit exactly once');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","session_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}',true);
do $$ begin
  begin perform public.garilink_identity_status();
    raise exception 'Expected unconfirmed identity denied'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','',true);
do $$ begin
  begin perform public.garilink_identity_create_case('{"requestId":"74444444-4444-4444-8444-444444444444","policyVersion":1}');
    raise exception 'Expected missing session denied'; exception when sqlstate 'PT401' then null; end;
end $$;
reset role;
