update public.gl_capabilities set expires_at=null,status='ACTIVE' where user_id='11111111-1111-4111-8111-111111111111' and type='MANAGE_LISTINGS';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select set_config('test.media.vehicle',(select vehicle_id::text from public.gl_listings where id=current_setting('test.listing.id')::uuid),true);
select set_config('test.media.reserved',public.garilink_reserve_vehicle_media(current_setting('test.media.vehicle')::uuid,'image/jpeg')::text,true);
select pg_temp.assert_true((current_setting('test.media.reserved')::jsonb->>'position')::int=1,'reservation follows cover deterministically');
insert into storage.objects(bucket_id,name,metadata) values('vehicle-media',current_setting('test.media.reserved')::jsonb->>'storagePath','{"size":2048,"mimetype":"image/jpeg"}');
select pg_temp.assert_true(public.garilink_finalize_vehicle_media((current_setting('test.media.reserved')::jsonb->>'id')::uuid,2048,1600,900)->>'byteSize'='2048','uploaded object finalized');
select pg_temp.assert_true(
  jsonb_array_length(garilink_private.vehicle_json((select v from public.gl_vehicles v where v.id=current_setting('test.media.vehicle')::uuid))->'images')=2,
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
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(public.garilink_vehicle_media_delete((current_setting('test.media.reserved')::jsonb->>'id')::uuid)->>'deleted'='true','owner removes media record');
reset role;
select 'PASS: media ownership, validation, finalization, cover order and deletion authorization' as result;
