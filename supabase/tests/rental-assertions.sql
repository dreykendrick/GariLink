set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
select set_config('test.rental.request.one', public.garilink_create_rental(jsonb_build_object(
  'listingId',current_setting('test.rental.id'),'requestId','51111111-1111-4111-8111-111111111111',
  'startDate',(current_date + 10)::text,'endDate',(current_date + 13)::text,'pickupNotes','Airport')) ->> 'id',true);
select pg_temp.assert_true(public.garilink_create_rental(jsonb_build_object(
  'listingId',current_setting('test.rental.id'),'requestId','51111111-1111-4111-8111-111111111111',
  'startDate',(current_date + 10)::text,'endDate',(current_date + 13)::text,'pickupNotes','Airport')) ->> 'id'
  = current_setting('test.rental.request.one'),'rental retry idempotent');

-- Once a listing joins V2 matching, rental creation must re-check live
-- requestability. Exact retries still recover the original result after a
-- state change, while a new stale submission is rejected.
update public.gl_vehicles v set
  vehicle_category='SUV',
  capabilities='{"schema_version":1,"passenger_capacity":5,"with_driver":true,"self_drive":true,"long_distance":true}'::jsonb,
  operational_availability='BUSY'
where v.id=(select l.vehicle_id from public.gl_listings l where l.id=current_setting('test.rental.id')::uuid);
select pg_temp.assert_true(public.garilink_create_rental(jsonb_build_object(
  'listingId',current_setting('test.rental.id'),'requestId','51111111-1111-4111-8111-111111111111',
  'startDate',(current_date + 10)::text,'endDate',(current_date + 13)::text,'pickupNotes','Airport')) ->> 'id'
  = current_setting('test.rental.request.one'),'idempotent retry survives availability change');
do $$ begin
  begin perform public.garilink_create_rental(jsonb_build_object(
    'listingId',current_setting('test.rental.id'),'requestId','54444444-4444-4444-8444-444444444444',
    'startDate',(current_date + 20)::text,'endDate',(current_date + 22)::text));
    raise exception 'Expected busy V2 vehicle rejected'; exception when sqlstate 'PT409' then null; end;
end $$;
update public.gl_vehicles v set operational_availability='AVAILABLE'
where v.id=(select l.vehicle_id from public.gl_listings l where l.id=current_setting('test.rental.id')::uuid);
do $$ begin
  begin perform public.garilink_create_rental(jsonb_build_object(
    'listingId',current_setting('test.rental.id'),'requestId','55555555-5555-4555-8555-555555555555',
    'startDate',(current_date + 20)::text,'endDate',(current_date + 22)::text,
    'transportNeed',jsonb_build_object('schemaVersion',1,'purpose','FAMILY_OR_GROUP','passengerCount',6)));
    raise exception 'Expected stale unsuitable V2 request rejected'; exception when sqlstate 'PT409' then null; end;
end $$;
select set_config('test.rental.request.two', public.garilink_create_rental(jsonb_build_object(
  'listingId',current_setting('test.rental.id'),'requestId','52222222-2222-4222-8222-222222222222',
  'startDate',(current_date + 11)::text,'endDate',(current_date + 14)::text)) ->> 'id',true);
select pg_temp.assert_true(jsonb_array_length(public.garilink_my_rentals()) = 2,'customer sees own rentals');
do $$ begin
  begin perform * from public.gl_rentals; raise exception 'Expected raw rental access denied';
    exception when insufficient_privilege then null; end;
  begin perform public.garilink_create_rental(jsonb_build_object(
    'listingId',current_setting('test.rental.id'),'requestId','53333333-3333-4333-8333-333333333333',
    'startDate',current_date::text,'endDate',(current_date + 2)::text));
    raise exception 'Expected past rental rejected'; exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(jsonb_array_length(public.garilink_workspace_rentals(current_setting('test.workspace.id')::uuid)) = 2,'owner sees requests');
select pg_temp.assert_true(public.garilink_rental_action(current_setting('test.workspace.id')::uuid,
  current_setting('test.rental.request.one')::uuid,'approve',null) ->> 'status' = 'APPROVED','owner approves request');
do $$ begin
  begin perform public.garilink_rental_action(current_setting('test.workspace.id')::uuid,
    current_setting('test.rental.request.two')::uuid,'approve',null);
    raise exception 'Expected overlap conflict'; exception when sqlstate 'PT409' then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
select pg_temp.assert_true(public.garilink_cancel_rental(current_setting('test.rental.request.one')::uuid) ->> 'status' = 'CANCELLED','customer cancels approved request');
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
do $$ begin
  begin perform public.garilink_cancel_rental(current_setting('test.rental.request.two')::uuid);
    raise exception 'Expected cross-account cancellation denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: rental snapshots, idempotency, ownership, transitions and database overlap exclusion' as result;
