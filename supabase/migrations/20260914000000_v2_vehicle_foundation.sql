begin;

-- V2 is additive. gl_vehicles remains the physical asset; gl_listings remains
-- the legacy/publication record during migration. Existing data is never
-- inferred as requestable: it must be explicitly configured for V2.
alter table public.gl_workspaces
  add column if not exists business_mode text;

update public.gl_workspaces
set business_mode = case
  when type in ('FLEET_OWNER', 'RENTAL_COMPANY', 'LOGISTICS') then 'FLEET'
  else 'INDIVIDUAL'
end
where business_mode is null;

alter table public.gl_workspaces
  alter column business_mode set default 'INDIVIDUAL',
  alter column business_mode set not null;

alter table public.gl_workspaces
  drop constraint if exists gl_workspaces_business_mode_check;
alter table public.gl_workspaces add constraint gl_workspaces_business_mode_check
  check (business_mode in ('INDIVIDUAL', 'FLEET'));

alter table public.gl_vehicles
  add column if not exists vehicle_category text,
  add column if not exists operational_availability text not null default 'UNAVAILABLE',
  add column if not exists availability_updated_at timestamptz not null default now(),
  add column if not exists capabilities jsonb;

alter table public.gl_vehicles
  drop constraint if exists gl_vehicles_category_check,
  drop constraint if exists gl_vehicles_operational_availability_check,
  drop constraint if exists gl_vehicles_capabilities_object_check;
alter table public.gl_vehicles add constraint gl_vehicles_category_check check (
  vehicle_category is null or vehicle_category in
    ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN','PICKUP','SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK')
);
alter table public.gl_vehicles add constraint gl_vehicles_operational_availability_check
  check (operational_availability in ('AVAILABLE','BUSY','UNAVAILABLE','MAINTENANCE'));
alter table public.gl_vehicles add constraint gl_vehicles_capabilities_object_check
  check (capabilities is null or jsonb_typeof(capabilities) = 'object');

create index if not exists gl_vehicles_v2_discovery
  on public.gl_vehicles (vehicle_category, operational_availability, workspace_id)
  where vehicle_category is not null;

create function garilink_private.validate_vehicle_capabilities(
  category text, input_value jsonb
) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare item record; schema_version int; passenger integer; payload numeric;
begin
  if category not in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN','PICKUP','SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK')
    or input_value is null or jsonb_typeof(input_value) <> 'object' then
    raise exception 'Invalid vehicle category or capabilities' using errcode='22023';
  end if;
  begin schema_version := (input_value->>'schema_version')::int; exception when others then
    raise exception 'Invalid capability schema version' using errcode='22023'; end;
  if schema_version <> 1 then raise exception 'Unsupported capability schema version' using errcode='22023'; end if;
  for item in select capability.key, capability.value from jsonb_each(input_value) as capability loop
    if item.key not in ('schema_version','transmission','fuel_type','self_drive','with_driver',
      'passenger_capacity','payload_kg','cargo_body','cargo_length_m','cargo_width_m','cargo_height_m') then
      raise exception 'Unsupported vehicle capability' using errcode='22023';
    end if;
    if item.key in ('transmission','fuel_type','cargo_body') and jsonb_typeof(item.value) <> 'string' then
      raise exception 'Invalid vehicle capability type' using errcode='22023';
    end if;
    if item.key in ('self_drive','with_driver') and jsonb_typeof(item.value) <> 'boolean' then
      raise exception 'Invalid vehicle capability type' using errcode='22023';
    end if;
    if item.key in ('passenger_capacity','payload_kg','cargo_length_m','cargo_width_m','cargo_height_m')
      and jsonb_typeof(item.value) <> 'number' then
      raise exception 'Invalid vehicle capability type' using errcode='22023';
    end if;
  end loop;
  begin passenger := (input_value->>'passenger_capacity')::int; payload := (input_value->>'payload_kg')::numeric;
  exception when others then raise exception 'Invalid vehicle capability value' using errcode='22023'; end;
  if passenger is not null and passenger not between 1 and 100 then raise exception 'Invalid passenger capacity' using errcode='22023'; end if;
  if payload is not null and payload < 0 then raise exception 'Invalid payload' using errcode='22023'; end if;
  if category in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN') and payload is not null then
    raise exception 'Payload is not supported for this category' using errcode='22023';
  end if;
  if category in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN') and
    (value ? 'cargo_body' or value ? 'cargo_length_m' or value ? 'cargo_width_m' or value ? 'cargo_height_m') then
    raise exception 'Cargo capabilities are not supported for this category' using errcode='22023';
  end if;
  if category in ('SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK') and passenger is not null then
    raise exception 'Passenger capacity is not supported for this category' using errcode='22023';
  end if;
  return input_value;
end;
$$;

create function garilink_private.v2_discovery_eligibility(v public.gl_vehicles)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'discoverable', exists(select 1 from public.gl_listings l
      join public.gl_workspaces w on w.id=l.workspace_id
      join public.gl_accounts a on a.id=w.owner_id
      join auth.users u on u.id=a.id
      where l.vehicle_id=v.id and l.type='FOR_HIRE' and l.status='PUBLISHED'
        and w.is_active and a.is_active and u.phone_confirmed_at is not null
        and v.vehicle_category is not null and v.capabilities is not null),
    'requestable', exists(select 1 from public.gl_listings l
      join public.gl_workspaces w on w.id=l.workspace_id
      join public.gl_accounts a on a.id=w.owner_id
      join auth.users u on u.id=a.id
      where l.vehicle_id=v.id and l.type='FOR_HIRE' and l.status='PUBLISHED'
        and w.is_active and a.is_active and u.phone_confirmed_at is not null
        and v.vehicle_category is not null and v.capabilities is not null
        and v.operational_availability='AVAILABLE'),
    'operationalAvailability', v.operational_availability
  );
$$;

create function public.garilink_v2_update_vehicle(target_vehicle_id uuid, patch jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid; v public.gl_vehicles; item record; category text; availability text; capability_value jsonb;
begin
  select * into v from public.gl_vehicles where id=target_vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  actor:=garilink_private.workspace_access(v.workspace_id,true);
  perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  if patch is null or jsonb_typeof(patch) <> 'object' then raise exception 'Invalid vehicle patch' using errcode='22023'; end if;
  for item in select key,value from jsonb_each(patch) loop
    if item.key not in ('vehicleCategory','operationalAvailability','capabilities') then
      raise exception 'Unsupported vehicle field' using errcode='22023';
    end if;
  end loop;
  category:=coalesce(patch->>'vehicleCategory',v.vehicle_category);
  availability:=coalesce(patch->>'operationalAvailability',v.operational_availability);
  capability_value:=case when patch ? 'capabilities' then patch->'capabilities' else v.capabilities end;
  if category is null or availability not in ('AVAILABLE','BUSY','UNAVAILABLE','MAINTENANCE') then
    raise exception 'Invalid vehicle state' using errcode='22023';
  end if;
  capability_value:=garilink_private.validate_vehicle_capabilities(category,capability_value);
  update public.gl_vehicles set vehicle_category=category, capabilities=capability_value,
    operational_availability=availability,
    availability_updated_at=case when availability<>v.operational_availability then now() else availability_updated_at end
    where id=v.id returning * into v;
  return garilink_private.vehicle_json(v) || jsonb_build_object(
    'vehicleCategory',v.vehicle_category,'operationalAvailability',v.operational_availability,
    'capabilities',v.capabilities,'eligibility',garilink_private.v2_discovery_eligibility(v));
end;
$$;

create function public.garilink_v2_discoverable_vehicles()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(
    garilink_private.listing_json(l) || jsonb_build_object(
      'vehicleCategory',v.vehicle_category,'operationalAvailability',v.operational_availability,
      'capabilities',v.capabilities,'eligibility',garilink_private.v2_discovery_eligibility(v))
    order by l.created_at desc,l.id),'[]'::jsonb)
  from public.gl_listings l join public.gl_vehicles v on v.id=l.vehicle_id
  where (garilink_private.v2_discovery_eligibility(v)->>'discoverable')::boolean;
$$;

create function public.garilink_v2_vehicle_eligibility(target_vehicle_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v public.gl_vehicles;
begin
  select * into v from public.gl_vehicles where id=target_vehicle_id;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  perform garilink_private.workspace_access(v.workspace_id);
  return garilink_private.v2_discovery_eligibility(v);
end;
$$;

revoke all on function garilink_private.validate_vehicle_capabilities(text,jsonb),
  garilink_private.v2_discovery_eligibility(public.gl_vehicles) from public,anon,authenticated;
revoke all on function public.garilink_v2_update_vehicle(uuid,jsonb),
  public.garilink_v2_vehicle_eligibility(uuid) from public,anon;
grant execute on function public.garilink_v2_update_vehicle(uuid,jsonb),
  public.garilink_v2_vehicle_eligibility(uuid) to authenticated;
revoke all on function public.garilink_v2_discoverable_vehicles() from public;
grant execute on function public.garilink_v2_discoverable_vehicles() to anon,authenticated;

commit;
