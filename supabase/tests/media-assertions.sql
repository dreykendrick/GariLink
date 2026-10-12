reset role;
select pg_temp.assert_true(current_user=session_user,'media fixture uses test administrator');
update public.gl_capabilities set expires_at=null,status='ACTIVE' where user_id='11111111-1111-4111-8111-111111111111' and type='MANAGE_LISTINGS';
select set_config('test.media.vehicle',(select vehicle_id::text from public.gl_listings where id=current_setting('test.listing.id')::uuid),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(pg_temp.request_actor_matches('11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'media operations use authenticated owner');
select pg_temp.assert_true(has_schema_privilege(current_user,'storage','USAGE'),
  'authenticated fixture can resolve Storage objects');
select pg_temp.assert_true(not has_schema_privilege(current_user,'storage','CREATE'),
  'authenticated fixture cannot create Storage schema objects');
select pg_temp.assert_true(not has_schema_privilege(current_user,'auth','USAGE'),
  'fixture correction does not grant Auth schema access');
select pg_temp.assert_true(has_table_privilege(current_user,'storage.objects','INSERT'),
  'existing object insert permission retained for policy tests');
select pg_temp.assert_true((select c.relrowsecurity and c.relowner<>r.oid
  from pg_class c join pg_roles r on r.rolname=current_user where c.oid='storage.objects'::regclass),
  'Storage RLS remains enabled and authenticated is not table owner');
select pg_temp.assert_true((select not r.rolsuper and not r.rolbypassrls from pg_roles r where r.rolname=current_user),
  'authenticated fixture has no superuser or RLS bypass');
do $$ declare table_name text; begin
  foreach table_name in array array['verification_requirements','verification_cases',
    'verification_documents','verification_review_assignments','verification_decisions','verification_audit'] loop
    perform pg_temp.assert_true(not has_table_privilege(current_user,
      'garilink_private.'||table_name,'SELECT,INSERT,UPDATE,DELETE'),
      'Storage usage does not grant private verification access');
  end loop;
  begin
    insert into storage.objects(bucket_id,name,metadata) values('verification-private',
      gen_random_uuid()::text||'/'||gen_random_uuid()::text,'{"size":68,"mimetype":"image/png"}');
    raise exception 'Expected private verification upload denied';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('test.media.reserved',public.garilink_reserve_vehicle_media(current_setting('test.media.vehicle')::uuid,'image/jpeg')::text,true);
select pg_temp.assert_true((current_setting('test.media.reserved')::jsonb->>'position')::int=1,'reservation follows cover deterministically');
insert into storage.objects(bucket_id,name,metadata) values('vehicle-media',current_setting('test.media.reserved')::jsonb->>'storagePath','{"size":2048,"mimetype":"image/jpeg"}');
select pg_temp.assert_true(public.garilink_finalize_vehicle_media((current_setting('test.media.reserved')::jsonb->>'id')::uuid,2048,1600,900)->>'byteSize'='2048','uploaded object finalized');
select pg_temp.assert_true(
  jsonb_array_length(public.garilink_vehicle(current_setting('test.media.vehicle')::uuid)->'images')=2,
  'V2 vehicle serializer preserves ready media');
select pg_temp.assert_true((public.garilink_reorder_vehicle_media(current_setting('test.media.vehicle')::uuid,array[
  (current_setting('test.media.reserved')::jsonb->>'id')::uuid,'a1111111-1111-4111-8111-111111111111'::uuid])->0->>'isCover')::boolean,'reorder creates one cover');
do $$ begin
  begin perform public.garilink_reorder_vehicle_media(current_setting('test.media.vehicle')::uuid,array['a1111111-1111-4111-8111-111111111111'::uuid]);
    raise exception 'Expected incomplete ordering rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_reserve_vehicle_media(gen_random_uuid(),'image/jpeg');
    raise exception 'Expected invalid vehicle rejected'; exception when sqlstate 'PT404' then null; end;
  begin perform * from public.gl_vehicle_media; raise exception 'Expected raw media denied';
    exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
do $$ begin
  begin perform public.garilink_reserve_vehicle_media(current_setting('test.media.vehicle')::uuid,'image/jpeg');
    raise exception 'Expected cross-workspace reserve denied'; exception when insufficient_privilege then null; end;
  begin perform public.garilink_vehicle_media_delete_ticket((current_setting('test.media.reserved')::jsonb->>'id')::uuid);
    raise exception 'Expected cross-workspace delete denied'; exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects(bucket_id,name,metadata) values('vehicle-media',
      current_setting('test.media.reserved')::jsonb->>'storagePath','{"size":2048,"mimetype":"image/jpeg"}');
    raise exception 'Expected cross-workspace Storage upload denied';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(public.garilink_vehicle_media_delete((current_setting('test.media.reserved')::jsonb->>'id')::uuid)->>'deleted'='true','owner removes media record');
reset role;
select 'PASS: media ownership, validation, finalization, cover order and deletion authorization' as result;
