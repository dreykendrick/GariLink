-- Real local Supabase schema smoke, not complete Auth/Storage lifecycle certification.
begin;
do $$ begin
  if current_database()<>'postgres' then raise exception 'Unexpected database'; end if;
  if not exists(select 1 from pg_extension where extname='postgis') then raise exception 'PostGIS missing'; end if;
  if to_regprocedure('garilink_private.workspace_preparation_access(uuid,boolean)') is null then raise exception 'Email preparation helper missing'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname like 'gl_%' and c.relkind='r' and not c.relrowsecurity) then raise exception 'Application table without RLS'; end if;
  if has_function_privilege('authenticated','garilink_private.require_user(boolean)','EXECUTE') then raise exception 'Private helper exposed'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform public.garilink_me();
    raise exception 'Anonymous identity RPC unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{}',true);
do $$ begin
  begin
    perform public.garilink_me();
    raise exception 'Missing session unexpectedly accepted';
  exception when sqlstate 'PT401' then null; end;
  begin
    update public.gl_accounts set is_active=true;
    raise exception 'Direct account write unexpectedly permitted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
