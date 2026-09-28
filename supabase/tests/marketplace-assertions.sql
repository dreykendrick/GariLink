update public.gl_capabilities set status = 'ACTIVE' where user_id = '11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select set_config('test.draft', jsonb_build_object('workspaceId',current_setting('test.workspace.id'),
  'requestId','f1111111-1111-4111-8111-111111111111','type','FOR_SALE','title','Toyota Corolla',
  'description','Maintained family car','county','Dar es Salaam','price',45000000,
  'vehicle',jsonb_build_object('make','Toyota','model','Corolla','year',2020,'type','CAR',
    'fuelType','PETROL','transmission','AUTOMATIC','condition','LOCAL_USED','mileage',45000))::text,true);
select set_config('test.listing.id', public.garilink_create_draft(current_setting('test.draft')::jsonb) ->> 'id',true);
select pg_temp.assert_true(public.garilink_create_draft(current_setting('test.draft')::jsonb) ->> 'id' = current_setting('test.listing.id'), 'draft retry idempotent');
select pg_temp.assert_true(jsonb_array_length(public.garilink_workspace_vehicles(current_setting('test.workspace.id')::uuid) -> 'data') = 1, 'atomic retry creates one vehicle');
select pg_temp.assert_true(jsonb_array_length(public.garilink_my_listings() -> 'data') = 1, 'owner sees draft');
select pg_temp.assert_true(not ((public.garilink_my_listings() -> 'data' -> 0) ? 'creation_payload'), 'private retry payload not exposed');
select pg_temp.assert_true(public.garilink_search_listings() ->> 'total' = '0', 'draft excluded from search');
do $$ declare bad jsonb; begin
  begin perform public.garilink_listing(current_setting('test.listing.id')::uuid);
    raise exception 'Expected private draft'; exception when sqlstate 'PT404' then null; end;
  begin perform public.garilink_create_draft(current_setting('test.draft')::jsonb || '{"price":100}');
    raise exception 'Expected conflicting retry'; exception when unique_violation then null; end;
  foreach bad in array array['{"price":0}'::jsonb,'{"price":1.001}','{"price":"500"}','{"isVerified":true}','{"status":"PUBLISHED"}','{"county":null}'] loop
    begin perform public.garilink_create_draft(current_setting('test.draft')::jsonb || bad);
      raise exception 'Expected invalid field rejected'; exception when invalid_parameter_value then null; end;
  end loop;
  begin perform public.garilink_create_draft(jsonb_set(current_setting('test.draft')::jsonb,'{vehicle,isVerified}','true'));
    raise exception 'Expected forged vehicle verification rejected'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
insert into public.gl_vehicle_media(id,vehicle_id,workspace_id,storage_path,mime_type,byte_size,width,height,position,status,created_by)
select 'a1111111-1111-4111-8111-111111111111',l.vehicle_id,l.workspace_id,
  l.workspace_id::text||'/'||l.vehicle_id::text||'/a1111111-1111-4111-8111-111111111111.jpg',
  'image/jpeg',1000,1200,800,0,'READY',l.created_by from public.gl_listings l where l.id=current_setting('test.listing.id')::uuid;
set local role authenticated;
select public.garilink_listing_status(current_setting('test.listing.id')::uuid,'publish');
select pg_temp.assert_true(public.garilink_listing_status(current_setting('test.listing.id')::uuid,'publish') ->> 'status' = 'PUBLISHED', 'publish retry idempotent');
select set_config('test.rental.id', public.garilink_create_draft(current_setting('test.draft')::jsonb ||
  '{"requestId":"f2222222-2222-4222-8222-222222222222","type":"FOR_HIRE","title":"Toyota for hire","price":80000}') ->> 'id',true);
reset role;
insert into public.gl_vehicle_media(id,vehicle_id,workspace_id,storage_path,mime_type,byte_size,width,height,position,status,created_by)
select 'a2222222-2222-4222-8222-222222222222',l.vehicle_id,l.workspace_id,
  l.workspace_id::text||'/'||l.vehicle_id::text||'/a2222222-2222-4222-8222-222222222222.jpg',
  'image/jpeg',1000,1200,800,0,'READY',l.created_by from public.gl_listings l where l.id=current_setting('test.rental.id')::uuid;
set local role authenticated;
select public.garilink_listing_status(current_setting('test.rental.id')::uuid,'publish');
reset role;
set local role anon;
select pg_temp.assert_true(public.garilink_search_listings() ->> 'total' = '2', 'anonymous public search');
select pg_temp.assert_true(public.garilink_search_listings('{"priceMax":100000}') ->> 'total' = '1', 'hire search uses daily rate');
select pg_temp.assert_true(public.garilink_search_listings('{"type":"FOR_SALE","q":"corolla","county":"dar"}') ->> 'total' = '1', 'type query location filters');
select pg_temp.assert_true(public.garilink_search_listings('{"transmission":"AUTOMATIC","fuelType":"PETROL"}') ->> 'total' = '2', 'vehicle specification filters');
select pg_temp.assert_true(public.garilink_search_listings('{"sort":"PRICE_ASC"}') -> 'data' -> 0 ->> 'type' = 'FOR_HIRE', 'ascending price is authoritative');
select pg_temp.assert_true(public.garilink_search_listings('{"sort":"PRICE_DESC"}') -> 'data' -> 0 ->> 'type' = 'FOR_SALE', 'descending price is authoritative');
select pg_temp.assert_true(public.garilink_search_listings('{"page":2,"limit":1}') ->> 'total' = '2', 'page total retained');
select pg_temp.assert_true(jsonb_array_length(public.garilink_search_listings('{"page":3,"limit":1}') -> 'data') = 0, 'empty page preserves shape');
do $$ begin
  begin perform public.garilink_search_listings('{"limit":1000}');
    raise exception 'Expected page size rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_search_listings('{"priceMin":100,"priceMax":50}');
    raise exception 'Expected inverted range rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_search_listings('{"sort":"POPULAR"}');
    raise exception 'Expected unsupported sort rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_my_listings();
    raise exception 'Expected anonymous inventory denied'; exception when insufficient_privilege then null; end;
  begin perform * from public.gl_listings;
    raise exception 'Expected raw listing access denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
select pg_temp.assert_true(public.garilink_my_listings() -> 'data' = '[]'::jsonb, 'suspended member cannot see inventory');
do $$ begin
  begin perform public.garilink_listing_status(current_setting('test.listing.id')::uuid,'archive');
    raise exception 'Expected cross workspace mutation rejected'; exception when insufficient_privilege then null; end;
  begin perform public.garilink_create_draft(current_setting('test.draft')::jsonb);
    raise exception 'Expected cross workspace draft rejected'; exception when insufficient_privilege then null; end;
  begin perform public.garilink_workspace_vehicles(current_setting('test.workspace.id')::uuid);
    raise exception 'Expected cross workspace inventory rejected'; exception when insufficient_privilege then null; end;
end $$;
select public.garilink_save_listing(current_setting('test.listing.id')::uuid,true);
select public.garilink_save_listing(current_setting('test.listing.id')::uuid,true);
select pg_temp.assert_true(jsonb_array_length(public.garilink_saved_listings() -> 'data') = 1, 'repeated save idempotent');
select pg_temp.assert_true(public.garilink_listing(current_setting('test.listing.id')::uuid) ->> 'saveCount' = '1', 'save count accurate');
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(public.garilink_saved_listings() -> 'data' = '[]'::jsonb, 'saves isolated by account');
select public.garilink_listing_status(current_setting('test.listing.id')::uuid,'pause');
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
select pg_temp.assert_true(public.garilink_saved_listings() -> 'data' = '[]'::jsonb, 'paused saved details hidden');
do $$ begin
  begin perform public.garilink_save_listing(current_setting('test.listing.id')::uuid,true);
    raise exception 'Expected save paused listing rejected'; exception when sqlstate 'PT404' then null; end;
end $$;
select pg_temp.assert_true(public.garilink_save_listing(current_setting('test.listing.id')::uuid,false) ->> 'saved' = 'false', 'can unsave hidden listing');
select public.garilink_save_listing(current_setting('test.listing.id')::uuid,false);
reset role;
update auth.users set banned_until = now() + interval '1 day' where id = '11111111-1111-4111-8111-111111111111';
set local role anon;
select pg_temp.assert_true(public.garilink_search_listings() ->> 'total' = '0', 'banned owner public listings hidden');
reset role;
update auth.users set banned_until = null where id = '11111111-1111-4111-8111-111111111111';
update public.gl_listings set expires_at = now() - interval '1 minute' where id = current_setting('test.rental.id')::uuid;
set local role anon;
select pg_temp.assert_true(public.garilink_search_listings() ->> 'total' = '0', 'expired and paused excluded');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select public.garilink_listing_status(current_setting('test.listing.id')::uuid,'archive');
select pg_temp.assert_true(public.garilink_my_listings() -> 'data' @> '[{"status":"EXPIRED"}]'::jsonb, 'owner sees expiry without background worker');
select pg_temp.assert_true(public.garilink_listing_status(current_setting('test.rental.id')::uuid,'publish') ->> 'status' = 'PUBLISHED', 'owner can renew expired listing');
do $$ begin
  begin perform public.garilink_listing_status(current_setting('test.listing.id')::uuid,'publish');
    raise exception 'Expected archived terminal state'; exception when sqlstate 'PT409' then null; end;
end $$;
reset role;
update public.gl_capabilities set expires_at = now() - interval '1 minute' where type = 'MANAGE_LISTINGS';
set local role authenticated;
do $$ begin
  begin perform public.garilink_listing_status(current_setting('test.rental.id')::uuid,'pause');
    raise exception 'Expected expired capability denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: marketplace atomic drafts, retry conflicts, privacy, filters, lifecycle, capabilities and saved isolation' as result;
