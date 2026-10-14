begin;

-- Repair the effective bodies AFTER email-first authorization transformations.
-- Do not recreate older bodies or broaden SECURITY DEFINER search paths.
do $$
declare
  target text; definition text; revised text;
  original_command constant text := 'set constraints gl_vehicle_media_position_unique deferred;';
  qualified_command constant text := 'set constraints public.gl_vehicle_media_position_unique deferred;';
  before_function pg_proc; after_function pg_proc;
begin
  if not exists(select 1 from pg_constraint c
    where c.conrelid='public.gl_vehicle_media'::regclass
      and c.connamespace='public'::regnamespace
      and c.conname='gl_vehicle_media_position_unique' and c.contype='u' and c.condeferrable) then
    raise exception 'Expected deferrable vehicle-media constraint missing';
  end if;
  foreach target in array array[
    'public.garilink_reorder_vehicle_media(uuid,uuid[])',
    'public.garilink_vehicle_media_delete(uuid)'
  ] loop
    select p.* into strict before_function from pg_proc p where p.oid=target::regprocedure;
    if not before_function.prosecdef or not exists(
      select 1 from unnest(before_function.proconfig) setting
      where setting in ('search_path=""','search_path=')) then
      raise exception 'Unexpected media RPC security configuration: %',target;
    end if;
    definition:=pg_get_functiondef(before_function.oid);
    if (length(definition)-length(replace(definition,original_command,'')))<>length(original_command) then
      raise exception 'Expected exactly one original constraint command: %',target;
    end if;
    revised:=replace(definition,original_command,qualified_command);
    execute revised;
    select p.* into strict after_function from pg_proc p where p.oid=before_function.oid;
    if after_function.proargnames is distinct from before_function.proargnames or
       after_function.proargtypes is distinct from before_function.proargtypes or
       after_function.proallargtypes is distinct from before_function.proallargtypes or
       after_function.proargmodes is distinct from before_function.proargmodes or
       after_function.proargdefaults::text is distinct from before_function.proargdefaults::text or
       after_function.prorettype is distinct from before_function.prorettype or
       after_function.prosecdef is distinct from before_function.prosecdef or
       after_function.proconfig is distinct from before_function.proconfig or
       after_function.proacl is distinct from before_function.proacl or
       after_function.proowner is distinct from before_function.proowner or
       pg_get_functiondef(after_function.oid) is distinct from revised then
      raise exception 'Unexpected media RPC metadata/body drift: %',target;
    end if;
  end loop;
end $$;

commit;
