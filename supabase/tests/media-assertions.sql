reset role;
select pg_temp.assert_true(current_user=session_user,'media fixture uses test administrator');
-- Actual final catalog definitions, not historical file text. The migration's
-- metadata equality guard also protects ACLs/ownership/signatures in replay.
do $$ declare target text; definition text; begin
  foreach target in array array['public.garilink_reorder_vehicle_media(uuid,uuid[])',
    'public.garilink_vehicle_media_delete(uuid)'] loop
    definition:=pg_get_functiondef(target::regprocedure);
    perform pg_temp.assert_true(position('set constraints public.gl_vehicle_media_position_unique deferred;' in definition)>0
      and position('set constraints gl_vehicle_media_position_unique deferred;' in definition)=0,
      'effective media constraint command is schema-qualified');
    perform pg_temp.assert_true(position('garilink_private.workspace_preparation_access(' in definition)>0
      and position('garilink_private.require_user(false)' in definition)>0,
      'final email-first preparation authorization retained');
  end loop;
  perform pg_temp.assert_true((select c.condeferrable from pg_constraint c
    where c.conrelid='public.gl_vehicle_media'::regclass and c.conname='gl_vehicle_media_position_unique'),
    'media position constraint remains deferrable');
end $$;
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
select set_config('test.media.reordered',public.garilink_reorder_vehicle_media(current_setting('test.media.vehicle')::uuid,array[
  (current_setting('test.media.reserved')::jsonb->>'id')::uuid,'a1111111-1111-4111-8111-111111111111'::uuid])::text,true);
select pg_temp.assert_true((current_setting('test.media.reordered')::jsonb->0->>'isCover')::boolean,'reorder sets first image as cover');
select pg_temp.assert_true((select count(*) filter(where (m->>'isCover')::boolean)=1
  and count(distinct (m->>'position')::int)=2 and min((m->>'position')::int)=0 and max((m->>'position')::int)=1
  from jsonb_array_elements(current_setting('test.media.reordered')::jsonb) m),
  'exactly one cover and unique contiguous reordered positions');
-- Force the real unique constraint to check the new positions now, not merely
-- at transaction end (the harness eventually rolls back).
set constraints public.gl_vehicle_media_position_unique immediate;
do $$ begin
  begin perform public.garilink_reorder_vehicle_media(current_setting('test.media.vehicle')::uuid,array[
    'a1111111-1111-4111-8111-111111111111'::uuid,'a1111111-1111-4111-8111-111111111111'::uuid]);
    raise exception 'Expected duplicate ordering rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_reorder_vehicle_media(current_setting('test.media.vehicle')::uuid,array['a1111111-1111-4111-8111-111111111111'::uuid]);
    raise exception 'Expected incomplete ordering rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_reserve_vehicle_media(gen_random_uuid(),'image/jpeg');
    raise exception 'Expected invalid vehicle rejected'; exception when sqlstate 'PT404' then null; end;
  begin perform * from public.gl_vehicle_media; raise exception 'Expected raw media denied';
    exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
do $$ begin
  begin perform public.garilink_reorder_vehicle_media(current_setting('test.media.vehicle')::uuid,array[
    (current_setting('test.media.reserved')::jsonb->>'id')::uuid,'a1111111-1111-4111-8111-111111111111'::uuid]);
    raise exception 'Expected cross-workspace reorder denied'; exception when insufficient_privilege then null; end;
  begin perform public.garilink_vehicle_media_delete((current_setting('test.media.reserved')::jsonb->>'id')::uuid);
    raise exception 'Expected cross-workspace deletion denied'; exception when insufficient_privilege then null; end;
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
set constraints public.gl_vehicle_media_position_unique immediate;
select pg_temp.assert_true(jsonb_array_length(public.garilink_vehicle(current_setting('test.media.vehicle')::uuid)->'images')=1
  and (public.garilink_vehicle(current_setting('test.media.vehicle')::uuid)->'images'->0->>'position')::int=0
  and (public.garilink_vehicle(current_setting('test.media.vehicle')::uuid)->'images'->0->>'isCover')::boolean,
  'deleting cover compacts remaining image to position zero');
reset role;
select pg_temp.assert_true(not exists(select 1 from public.gl_vehicle_media m
  where m.vehicle_id=current_setting('test.media.vehicle')::uuid
  group by m.vehicle_id,m.position having count(*)>1),'no duplicate vehicle-position pair survives');
select 'PASS: media ownership, validation, finalization, cover order and deletion authorization' as result;
