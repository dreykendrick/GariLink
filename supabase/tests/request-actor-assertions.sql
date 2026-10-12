-- Test the fixture assertion itself, without Auth-schema grants/helpers.
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(not pg_temp.request_actor_matches('11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'administrator cannot masquerade as authenticated assertion');
set local role authenticated;
select pg_temp.assert_true(pg_temp.request_actor_matches('11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'exact role/sub/session accepted');
select pg_temp.assert_true(not pg_temp.request_actor_matches('22222222-2222-4222-8222-222222222222',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'wrong subject rejected');
select pg_temp.assert_true(not pg_temp.request_actor_matches('11111111-1111-4111-8111-111111111111',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),'wrong session rejected');
do $$ declare value text; begin
  foreach value in array array['','{invalid','null','[]','{}','{"sub":42,"session_id":false}'] loop
    perform set_config('request.jwt.claims',value,true);
    perform pg_temp.assert_true(not pg_temp.request_actor_matches('11111111-1111-4111-8111-111111111111',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'absent/malformed claims fail closed');
  end loop;
end $$;
select set_config('request.jwt.claims','',true);
reset role;
