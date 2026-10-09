-- Run after existing fixtures inside run-local-sql.ps1's rollback transaction.
reset role;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
values('44444444-4444-4444-8444-444444444444','email-only@example.test',now(),'{}');
insert into auth.sessions values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','44444444-4444-4444-8444-444444444444');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}',true);
select pg_temp.assert_true((public.garilink_me()->>'isEmailVerified')::boolean,'email-only account authenticated');
select pg_temp.assert_true(not (public.garilink_me()->>'isPhoneVerified')::boolean,'email approval does not verify phone');
select pg_temp.assert_true(public.garilink_update_profile('{"displayName":"Email renter"}')->>'displayName'='Email renter','basic profile needs no phone');
select pg_temp.assert_true(jsonb_array_length(public.garilink_my_rentals())=0,'empty rental history readable without contact');
select pg_temp.assert_true(jsonb_array_length(public.garilink_saved_listings()->'data')=0,'saved vehicles readable without contact');
select set_config('test.email.workspace',public.garilink_create_workspace('{"name":"Email preparation garage","type":"PERSONAL","requestId":"e1111111-1111-4111-8111-111111111111"}')->>'id',true);
select pg_temp.assert_true(jsonb_array_length(public.garilink_workspaces())=1,'workspace creation without phone');
select pg_temp.assert_true(public.garilink_workspace(current_setting('test.email.workspace')::uuid)->>'name'='Email preparation garage','authorized workspace readable');
select set_config('test.email.draft',public.garilink_v2_create_vehicle_draft(jsonb_build_object(
 'workspaceId',current_setting('test.email.workspace'),'requestId','e2222222-2222-4222-8222-222222222222',
 'title','Controlled draft','county','Dar es Salaam','price',100000,
 'vehicle',jsonb_build_object('make','Toyota','model','Prado','year',2020,'type','CAR','fuelType','DIESEL','transmission','AUTOMATIC','condition','LOCAL_USED','mileage',10000),
 'vehicleCategory','SUV','capabilities',jsonb_build_object('schema_version',1,'passenger_capacity',5,'self_drive',true,'with_driver',true)))::text,true);
select pg_temp.assert_true(jsonb_array_length(public.garilink_workspace_vehicles(current_setting('test.email.workspace')::uuid)->'data')=1,'draft created without phone');
do $$ declare vehicle_id uuid;
begin
  vehicle_id:=(current_setting('test.email.draft')::jsonb->>'vehicleId')::uuid;
  begin perform public.garilink_v2_set_publication(vehicle_id,'publish');
    raise exception 'Expected publication contact gate'; exception when insufficient_privilege then null; end;
  begin perform public.garilink_create_rental('{}');
    raise exception 'Expected rental contact gate'; exception when insufficient_privilege then null; end;
  begin perform public.garilink_workspace(current_setting('test.workspace.id')::uuid);
    raise exception 'Expected tenant isolation'; exception when insufficient_privilege then null; end;
  begin update public.gl_accounts set is_active=true;
    raise exception 'Expected direct writes denied'; exception when insufficient_privilege then null; end;
end; $$;
reset role;
select 'PASS: email preparation access, no contact promotion, protected publication/rentals and tenant isolation' as result;
