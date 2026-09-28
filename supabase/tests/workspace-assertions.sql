-- Restore the two existing test actors after identity suspension/revocation tests.
update public.gl_accounts set is_active = true;
insert into auth.sessions values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}', true);
select set_config('test.workspace.id', public.garilink_create_workspace(
  '{"name":"Juma Motors","type":"PERSONAL","requestId":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}') ->> 'id', true);
select pg_temp.assert_true(public.garilink_create_workspace(
  '{"name":"Juma Motors","type":"PERSONAL","requestId":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}') ->> 'id' = current_setting('test.workspace.id'), 'workspace create idempotent');
select pg_temp.assert_true(jsonb_array_length(public.garilink_workspaces()) = 1, 'retry created no duplicate workspace');
select pg_temp.assert_true(public.garilink_workspace(current_setting('test.workspace.id')::uuid) ->> 'isVerified' = 'false', 'new workspace not falsely verified');
select pg_temp.assert_true(public.garilink_workspace(current_setting('test.workspace.id')::uuid) ->> 'businessMode' = 'INDIVIDUAL', 'new personal workspace derives individual mode');
select pg_temp.assert_true(public.garilink_me() -> 'roles' @> '["PRIVATE_OWNER"]'::jsonb, 'owner onboarding grants owner role');
select pg_temp.assert_true(not (public.garilink_me() -> 'roles' @> '["ADMIN"]'::jsonb), 'owner onboarding does not grant admin');
select pg_temp.assert_true(public.garilink_update_workspace(current_setting('test.workspace.id')::uuid,
  '{"name":"Juma Fleet"}') ->> 'name' = 'Juma Fleet', 'owner can update workspace');
do $$ begin
  begin perform public.garilink_create_workspace('{"name":"Changed","type":"PERSONAL","requestId":"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}');
    raise exception 'Expected reused request ID conflict'; exception when unique_violation then null; end;
  begin perform public.garilink_update_workspace(current_setting('test.workspace.id')::uuid, '{"isVerified":true}');
    raise exception 'Expected verification spoof rejected'; exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}', true);
select pg_temp.assert_true(public.garilink_workspaces() = '[]'::jsonb, 'unrelated workspaces hidden');
do $$ begin
  begin perform public.garilink_workspace(current_setting('test.workspace.id')::uuid);
    raise exception 'Expected cross-workspace access denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.gl_workspace_members(workspace_id,user_id,role)
values (current_setting('test.workspace.id')::uuid,'22222222-2222-4222-8222-222222222222','VIEWER');
set local role authenticated;
select pg_temp.assert_true(public.garilink_workspace(current_setting('test.workspace.id')::uuid) ->> 'name' = 'Juma Fleet', 'viewer can read');
do $$ begin
  begin perform public.garilink_update_workspace(current_setting('test.workspace.id')::uuid, '{"name":"Attacker"}');
    raise exception 'Expected viewer write denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.gl_workspace_members set status = 'SUSPENDED' where user_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ begin
  begin perform public.garilink_workspace(current_setting('test.workspace.id')::uuid);
    raise exception 'Expected suspended member denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.gl_capabilities set status = 'REVOKED' where user_id = '11111111-1111-4111-8111-111111111111' and type = 'LIST_VEHICLES';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}', true);
select set_config('test.fleet.workspace.id', public.garilink_create_workspace(
  '{"name":"Second workspace","type":"FLEET_OWNER","requestId":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"}') ->> 'id', true);
select pg_temp.assert_true(public.garilink_workspace(current_setting('test.fleet.workspace.id')::uuid) ->> 'businessMode' = 'FLEET', 'new fleet workspace derives fleet mode');
select pg_temp.assert_true(public.garilink_me() -> 'capabilities' @> '[{"type":"LIST_VEHICLES","status":"REVOKED"}]'::jsonb, 'new workspace cannot reactivate revoked capability');
reset role;
select 'PASS: workspace ownership, idempotent creation, viewer isolation, suspension and capability preservation' as result;
