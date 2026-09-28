begin;

-- business_mode is derived from the established workspace type. The V2
-- foundation migration backfilled existing rows, but a plain column default
-- caused newly-created fleet/logistics workspaces to serialize as INDIVIDUAL.
create or replace function garilink_private.assign_workspace_business_mode()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.business_mode := case
    when new.type in ('FLEET_OWNER', 'RENTAL_COMPANY', 'LOGISTICS')
      then 'FLEET'
    else 'INDIVIDUAL'
  end;
  return new;
end;
$$;

revoke all on function garilink_private.assign_workspace_business_mode()
  from public, anon, authenticated;

drop trigger if exists gl_workspaces_assign_business_mode
  on public.gl_workspaces;
create trigger gl_workspaces_assign_business_mode
before insert or update of type on public.gl_workspaces
for each row execute function garilink_private.assign_workspace_business_mode();

commit;
