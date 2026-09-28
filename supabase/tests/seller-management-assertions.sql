-- Run after the identity/workspace/marketplace fixture assertions.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(
  public.garilink_update_listing(current_setting('test.rental.id')::uuid,
    '{"title":"Updated owner listing","county":"Arusha","price":95000}'::jsonb) @>
    '{"title":"Updated owner listing","county":"Arusha","askingPrice":null}'::jsonb,
  'authorized owner can update safe listing fields');
do $$ begin
  begin perform public.garilink_update_listing(current_setting('test.rental.id')::uuid,'{"status":"PUBLISHED"}');
    raise exception 'Expected forged state rejected'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
do $$ begin
  begin perform public.garilink_update_listing(current_setting('test.rental.id')::uuid,'{"title":"Hijacked"}');
    raise exception 'Expected cross-workspace edit denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: seller listing edits enforce safe fields and workspace authorization' as result;
