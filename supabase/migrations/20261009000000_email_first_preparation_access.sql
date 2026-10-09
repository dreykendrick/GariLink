begin;

-- Keep the default sensitive-action phone requirement. Low-risk callers opt
-- into confirmed email OR the supported confirmed-phone legacy identity.
create or replace function garilink_private.require_user(require_verified boolean default true)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare actor uuid;
begin
  if not exists (select 1 from auth.sessions s where s.user_id=auth.uid()
    and s.id::text=auth.jwt()->>'session_id') then
    raise sqlstate 'PT401' using message='Your session has expired. Please sign in again.';
  end if;
  select u.id into actor from auth.users u join public.gl_accounts a on a.id=u.id
  where u.id=auth.uid() and a.is_active and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<=now())
    and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)
    and (not require_verified or u.phone_confirmed_at is not null);
  if actor is null then
    raise exception 'A confirmed account is required; verify contact before sensitive actions.' using errcode='42501';
  end if;
  return actor;
end; $$;
revoke all on function garilink_private.require_user(boolean) from public,anon,authenticated;

create function garilink_private.workspace_preparation_access(workspace_id uuid,write_access boolean default false)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false);
begin
  if not exists(select 1 from public.gl_workspaces w
    where w.id=workspace_preparation_access.workspace_id and w.is_active
    and (w.owner_id=actor or exists(select 1 from public.gl_workspace_members m
      where m.workspace_id=w.id and m.user_id=actor and m.status='ACTIVE'
      and (not write_access or m.role in ('OWNER','MANAGER'))))) then
    raise exception 'Workspace access denied' using errcode='42501';
  end if;
  return actor;
end; $$;
revoke all on function garilink_private.workspace_preparation_access(uuid,boolean) from public,anon,authenticated;

create function garilink_private.vehicle_preparation_access(vehicle_id uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare v public.gl_vehicles; actor uuid;
begin
  select x.* into v from public.gl_vehicles x where x.id=vehicle_preparation_access.vehicle_id;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  actor:=garilink_private.workspace_preparation_access(v.workspace_id,true);
  if exists(select 1 from public.gl_listings l where l.vehicle_id=v.id and l.status<>'DRAFT') then
    perform garilink_private.require_user();
  end if;
  return actor;
end; $$;
revoke all on function garilink_private.vehicle_preparation_access(uuid) from public,anon,authenticated;

-- Preserve the final deployed bodies, argument names, grants, search_path,
-- tenant and capability checks. Transform only an explicit reviewed allowlist.
-- Abort if a target does not contain the expected authorization call.
do $$
declare target text; definition text; revised text;
begin
  foreach target in array array[
    'public.garilink_update_profile(jsonb)',
    'public.garilink_workspaces()',
    'public.garilink_create_workspace(jsonb)',
    'public.garilink_my_listings()',
    'public.garilink_saved_listings()',
    'public.garilink_save_listing(uuid,boolean)',
    'public.garilink_my_rentals()'
  ] loop
    definition:=pg_get_functiondef(target::regprocedure);
    revised:=replace(definition,'garilink_private.require_user()','garilink_private.require_user(false)');
    if revised=definition then raise exception 'Unexpected authorization body: %',target; end if;
    execute revised;
  end loop;
  foreach target in array array[
    'public.garilink_workspace(uuid)',
    'public.garilink_update_workspace(uuid,jsonb)',
    'public.garilink_create_draft(jsonb)',
    'public.garilink_v2_create_vehicle_draft(jsonb)',
    'public.garilink_update_listing(uuid,jsonb)',
    'public.garilink_vehicle(uuid)',
    'public.garilink_workspace_vehicles(uuid)',
    'public.garilink_v2_update_vehicle(uuid,jsonb)',
    'public.garilink_v2_vehicle_eligibility(uuid)',
    'public.garilink_v2_update_vehicle_location(uuid,jsonb)',
    'public.garilink_v2_vehicle_location(uuid)',
    'public.garilink_vehicle_rental_pricing(uuid)',
    'public.garilink_reserve_vehicle_media(uuid,text)',
    'public.garilink_finalize_vehicle_media(uuid,integer,integer,integer)',
    'public.garilink_reorder_vehicle_media(uuid,uuid[])',
    'public.garilink_vehicle_media_delete(uuid)',
    'public.garilink_vehicle_media_delete_ticket(uuid)',
    'public.garilink_workspace_rentals(uuid)'
  ] loop
    definition:=pg_get_functiondef(target::regprocedure);
    revised:=replace(definition,'garilink_private.workspace_access(', 'garilink_private.workspace_preparation_access(');
    revised:=replace(revised,'garilink_private.require_user()','garilink_private.require_user(false)');
    if revised=definition then raise exception 'Unexpected workspace authorization body: %',target; end if;
    if target in ('public.garilink_v2_update_vehicle(uuid,jsonb)', 'public.garilink_v2_update_vehicle_location(uuid,jsonb)') then
      if position('garilink_private.workspace_preparation_access(v.workspace_id,true)' in revised)=0 then
        raise exception 'Unexpected vehicle mutation guard: %',target;
      end if;
      revised:=replace(revised,'garilink_private.workspace_preparation_access(v.workspace_id,true)', 'garilink_private.vehicle_preparation_access(v.id)');
    elsif target='public.garilink_update_listing(uuid,jsonb)' then
      if position('garilink_private.workspace_preparation_access(l.workspace_id,true)' in revised)=0 then
        raise exception 'Unexpected listing mutation guard: %',target;
      end if;
      revised:=replace(revised,'garilink_private.workspace_preparation_access(l.workspace_id,true)', 'garilink_private.vehicle_preparation_access(l.vehicle_id)');
    end if;
    execute revised;
  end loop;
end; $$;

-- Intentionally untouched: listing_status, v2_set_publication, create_rental,
-- cancel_rental, rental_action and pricing mutations. Live vehicle/listing edits
-- retain verified-phone requirements through vehicle_preparation_access.
-- Existing role/capability assignment is preparation authority, never KYC.
commit;
