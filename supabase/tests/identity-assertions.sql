insert into auth.users(id, phone, phone_confirmed_at, raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111', '255700000001', now(), '{"firstName":"Juma","lastName":"Rashid","role":"ADMIN","isActive":true,"capabilities":["ADMIN"]}'),
('22222222-2222-4222-8222-222222222222', '255700000002', now(), '{"firstName":"Asha"}'),
('33333333-3333-4333-8333-333333333333', '255700000003', null, '{"firstName":"Pending"}');
insert into auth.sessions values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '33333333-3333-4333-8333-333333333333');

select pg_temp.assert_true((select count(*) = 3 from public.gl_accounts), 'accounts bootstrapped');
select pg_temp.assert_true((select count(*) = 0 from public.gl_user_roles where role <> 'CUSTOMER'), 'metadata cannot grant roles');
select pg_temp.assert_true((select count(*) = 0 from public.gl_capabilities), 'metadata cannot grant capabilities');
select pg_temp.assert_true((select count(*) = 4 from pg_class where relname in ('gl_accounts','gl_profiles','gl_user_roles','gl_capabilities') and relrowsecurity), 'RLS enabled');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}', true);
select pg_temp.assert_true(public.garilink_me() -> 'profile' ->> 'firstName' = 'Juma', 'registered name returned');
select pg_temp.assert_true(public.garilink_me() -> 'roles' = '["CUSTOMER"]'::jsonb, 'only customer role returned');
select pg_temp.assert_true(public.garilink_me() ->> 'phoneNumber' = '+255700000001', 'phone normalized');
select pg_temp.assert_true(not (public.garilink_me() ? 'passwordHash'), 'no password hash exposed');
select pg_temp.assert_true(public.garilink_update_profile('{"firstName":"Updated","city":"Dar es Salaam"}') ->> 'firstName' = 'Updated', 'profile update succeeds');

do $$ begin
  begin perform public.garilink_update_profile('{"userId":"22222222-2222-4222-8222-222222222222"}');
    raise exception 'Expected invalid profile field'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_update_profile(jsonb_build_object('firstName', repeat('x',81)));
    raise exception 'Expected length rejection'; exception when invalid_parameter_value then null; end;
  begin update public.gl_accounts set is_active = true;
    raise exception 'Expected direct account write denied'; exception when insufficient_privilege then null; end;
  begin insert into public.gl_user_roles values ('11111111-1111-4111-8111-111111111111','ADMIN',now());
    raise exception 'Expected direct role write denied'; exception when insufficient_privilege then null; end;
  begin perform * from public.gl_profiles;
    raise exception 'Expected raw profile read denied'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}', true);
select pg_temp.assert_true(public.garilink_me() -> 'profile' ->> 'firstName' = 'Asha', 'other user unaffected');
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","session_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}', true);
do $$ begin
  begin perform public.garilink_update_profile('{"firstName":"Bypass"}');
    raise exception 'Expected unverified write denied'; exception when insufficient_privilege then null; end;
end $$;

reset role;
update public.gl_accounts set is_active = false where id = '11111111-1111-4111-8111-111111111111';
delete from auth.sessions where user_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}', true);
do $$ begin
  begin perform public.garilink_me(); raise exception 'Expected suspended account denied';
    exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}', true);
do $$ begin
  begin perform public.garilink_me(); raise exception 'Expected revoked session denied';
    exception when sqlstate 'PT401' then null; end;
end $$;
set local role anon;
do $$ begin
  begin perform public.garilink_me(); raise exception 'Expected anonymous RPC denied';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: identity bootstrap, safe projection, profile validation, role isolation, suspension and session revocation' as result;

set local role service_role;
select pg_temp.assert_true(public.garilink_claim_sms('test-webhook') = 'NEW', 'new SMS claimed once');
select pg_temp.assert_true(public.garilink_claim_sms('test-webhook') = 'UNKNOWN', 'uncertain SMS not reclaimed');
select public.garilink_accept_sms('test-webhook');
select pg_temp.assert_true(public.garilink_claim_sms('test-webhook') = 'ACCEPTED', 'accepted SMS deduplicated');
set local role authenticated;
do $$ begin
  begin perform public.garilink_claim_sms('attacker'); raise exception 'Expected user SMS ledger denied';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: durable SMS claims, acceptance, retry deduplication and restricted execution' as result;
