-- Execute only inside a disposable canonical-chain rollback transaction.
-- This certifies CLOSED rollout boundaries, not an operational KYC service.
select pg_temp.assert_true(
  (select not b.public and b.file_size_limit=5242880 from storage.buckets b
    where b.id='verification-private'), 'private constrained verification bucket');
select pg_temp.assert_true(not has_function_privilege('anon',
  'public.garilink_verification_requirements(text)','EXECUTE'), 'anonymous advisory denied');
select pg_temp.assert_true(has_function_privilege('authenticated',
  'public.garilink_verification_requirements(text)','EXECUTE'), 'confirmed session advisory entry point');
do $$ declare object_name text; role_name text; begin
  foreach object_name in array array['verification_requirements','verification_cases',
    'verification_documents','verification_review_assignments','verification_decisions','verification_audit'] loop
    perform pg_temp.assert_true((select c.relrowsecurity from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='garilink_private' and c.relname=object_name), 'RLS enabled: '||object_name);
    foreach role_name in array array['anon','authenticated','service_role'] loop
      perform pg_temp.assert_true(not has_table_privilege(role_name,
        'garilink_private.'||object_name,'SELECT,INSERT,UPDATE,DELETE'),
        'no direct verification privileges: '||role_name||'/'||object_name);
    end loop;
  end loop;
end $$;
select pg_temp.assert_true((select not p.polpermissive and p.polcmd='*'
  from pg_policy p where p.polrelid='storage.objects'::regclass
  and p.polname='verification_collection_closed'),'restrictive closed collection policy');
select pg_temp.assert_true(not exists(select 1 from garilink_private.verification_requirements r
  where r.approved_policy),'no active verification policy');
do $$ begin
  begin
    insert into garilink_private.verification_requirements(key,scope,policy_version)
      values('invalid-scope-fixture','UNKNOWN',1);
    raise exception 'SECURITY FAILURE: unknown requirement scope accepted';
  exception when check_violation then null; end;
  begin
    update garilink_private.verification_requirements set approved_policy=true where key='identity';
    raise exception 'SECURITY FAILURE: closed policy activated';
  exception when check_violation then null; end;
end $$;
set local role anon;
do $$ begin
  begin
    perform public.garilink_verification_requirements('SELF_DRIVE_REQUEST');
    raise exception 'SECURITY FAILURE: anonymous advisory executed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','',true);
set local role authenticated;
do $$ begin
  begin
    perform public.garilink_verification_requirements('SELF_DRIVE_REQUEST');
    raise exception 'SECURITY FAILURE: no-session advisory executed';
  exception when sqlstate 'PT401' then null; end;
end $$;
-- Closed tables intentionally deny even the subject, workspace coworker and
-- purported reviewer. This is not certification of future row-scoped access.
do $$ declare actor text; table_name text; begin
  foreach actor in array array['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'] loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,
      'session_id','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')::text,true);
    foreach table_name in array array['verification_cases','verification_documents',
      'verification_review_assignments','verification_decisions','verification_audit'] loop
      begin
        execute format('select 1 from garilink_private.%I limit 1',table_name);
        raise exception 'SECURITY FAILURE: private verification record readable';
      exception when insufficient_privilege then null; end;
    end loop;
    begin
      insert into garilink_private.verification_review_assignments(case_id,reviewer_id,assigned_by,expires_at)
        values(gen_random_uuid(),actor::uuid,actor::uuid,now()+interval '1 day');
      raise exception 'SECURITY FAILURE: reviewer self-assignment accepted';
    exception when insufficient_privilege then null; end;
    begin
      update garilink_private.verification_cases set state='APPROVED';
      raise exception 'SECURITY FAILURE: frontend approval accepted';
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
do $$ begin
  begin
    insert into storage.objects(bucket_id,name) values
      ('verification-private','11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222');
    raise exception 'SECURITY FAILURE: verification upload accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Administrative synthetic object only; rolled back by disposable harness.
insert into storage.objects(bucket_id,name) values
  ('verification-private','11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222');
set local role authenticated;
select pg_temp.assert_true(not exists(select 1 from storage.objects
  where bucket_id='verification-private'), 'private document not readable');
do $$ declare affected integer; begin
  update storage.objects set metadata='{}'::jsonb where bucket_id='verification-private';
  get diagnostics affected=row_count;
  perform pg_temp.assert_true(affected=0,'overwrite denied');
  begin
    delete from storage.objects where bucket_id='verification-private';
    get diagnostics affected=row_count;
  exception when insufficient_privilege then
    -- Real Supabase also forbids direct SQL deletion from storage tables.
    -- Denial is acceptable; do not disable its protection trigger.
    affected:=0;
  end;
  perform pg_temp.assert_true(affected=0,'deletion denied');
end $$;
reset role;
select pg_temp.assert_true((select count(*)=1 from storage.objects where bucket_id='verification-private'),
  'synthetic private object retained after unauthorized deletion');
