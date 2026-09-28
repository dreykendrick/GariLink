begin;

-- Location foundation is additive. Exact coordinates are owner/rental scoped;
-- public serializers must project only locality/city/region.
alter table public.gl_vehicles
  add column if not exists operational_location jsonb,
  add column if not exists public_locality text;

alter table public.gl_rentals
  add column if not exists pickup_location_snapshot jsonb,
  add column if not exists destination_location_snapshot jsonb;

create or replace function garilink_private.validate_location(input_value jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare v_lat numeric; v_lng numeric; v_accuracy numeric; v_source text; item record;
begin
  if input_value is null or jsonb_typeof(input_value) <> 'object' then raise exception 'Invalid location' using errcode='22023'; end if;
  for item in select i.key,i.value from jsonb_each(input_value) i loop
    if item.key not in ('schemaVersion','latitude','longitude','locality','city','region','countryCode','source','accuracyMeters','capturedAt') then raise exception 'Unsupported location field' using errcode='22023'; end if;
  end loop;
  if input_value ? 'schemaVersion' and input_value->>'schemaVersion' <> '1' then raise exception 'Unsupported location schema version' using errcode='22023'; end if;
  if input_value ? 'latitude' then begin v_lat := (input_value->>'latitude')::numeric; exception when others then raise exception 'Invalid latitude' using errcode='22023'; end; if v_lat < -90 or v_lat > 90 then raise exception 'Invalid latitude' using errcode='22023'; end if; end if;
  if input_value ? 'longitude' then begin v_lng := (input_value->>'longitude')::numeric; exception when others then raise exception 'Invalid longitude' using errcode='22023'; end; if v_lng < -180 or v_lng > 180 then raise exception 'Invalid longitude' using errcode='22023'; end if; end if;
  if input_value ? 'accuracyMeters' then begin v_accuracy := (input_value->>'accuracyMeters')::numeric; exception when others then raise exception 'Invalid accuracy' using errcode='22023'; end; if v_accuracy < 0 then raise exception 'Invalid accuracy' using errcode='22023'; end if; end if;
  if input_value ? 'source' then v_source := input_value->>'source'; if v_source not in ('DEVICE','MANUAL','PLACE_SELECTION','OWNER_CONFIGURED','SYSTEM_DERIVED') then raise exception 'Invalid location source' using errcode='22023'; end if; end if;
  if coalesce(length(input_value->>'locality'),0) > 100 or coalesce(length(input_value->>'city'),0) > 100 or coalesce(length(input_value->>'region'),0) > 100 or coalesce(length(input_value->>'countryCode'),0) > 3 then raise exception 'Invalid location label' using errcode='22023'; end if;
  return input_value;
end; $$;

create or replace function public.garilink_v2_update_vehicle_location(target_vehicle_id uuid, location jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.gl_vehicles; actor uuid; validated jsonb;
begin
  select * into v from public.gl_vehicles where id=target_vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  actor:=garilink_private.workspace_access(v.workspace_id,true); perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  validated:=garilink_private.validate_location(location);
  update public.gl_vehicles set operational_location=validated, public_locality=coalesce(validated->>'locality',validated->>'city') where id=v.id returning * into v;
  return garilink_private.vehicle_json(v) || jsonb_build_object('operationalLocation',v.operational_location,'publicLocality',v.public_locality);
end; $$;

revoke all on function garilink_private.validate_location(jsonb) from public,anon,authenticated;
revoke all on function public.garilink_v2_update_vehicle_location(uuid,jsonb) from public,anon;
grant execute on function public.garilink_v2_update_vehicle_location(uuid,jsonb) to authenticated;

commit;
