begin;

-- Suitability V1 uses only explicit, validated capabilities.  No source
-- coordinate or private operational data is returned by the matching RPC.
create or replace function garilink_private.validate_vehicle_capabilities(category text, value jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare item record; schema_version int; passenger integer; payload numeric;
begin
  if category is null or category not in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN','PICKUP','SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK')
    or value is null or jsonb_typeof(value) <> 'object' then
    raise exception 'Invalid vehicle category or capabilities' using errcode='22023';
  end if;
  begin schema_version := (value->>'schema_version')::int;
  exception when others then raise exception 'Invalid capability schema' using errcode='22023'; end;
  if schema_version <> 1 then raise exception 'Unsupported capability schema' using errcode='22023'; end if;
  for item in select capability.key, capability.value from jsonb_each(value) as capability loop
    if item.key not in ('schema_version','transmission','fuel_type','self_drive','with_driver','long_distance','passenger_capacity','payload_kg','cargo_body','cargo_length_m','cargo_width_m','cargo_height_m') then
      raise exception 'Unsupported vehicle capability' using errcode='22023';
    end if;
    if item.key in ('self_drive','with_driver','long_distance') and jsonb_typeof(item.value) <> 'boolean' then
      raise exception 'Invalid vehicle capability type' using errcode='22023';
    end if;
    if item.key in ('passenger_capacity','payload_kg','cargo_length_m','cargo_width_m','cargo_height_m') and jsonb_typeof(item.value) <> 'number' then
      raise exception 'Invalid vehicle capability type' using errcode='22023';
    end if;
    if item.key in ('transmission','fuel_type','cargo_body') and jsonb_typeof(item.value) <> 'string' then
      raise exception 'Invalid vehicle capability type' using errcode='22023';
    end if;
  end loop;
  begin passenger := (value->>'passenger_capacity')::int; payload := (value->>'payload_kg')::numeric;
  exception when others then raise exception 'Invalid vehicle capacity' using errcode='22023'; end;
  if passenger is not null and passenger not between 1 and 100 then raise exception 'Invalid passenger capacity' using errcode='22023'; end if;
  if payload is not null and payload < 0 then raise exception 'Invalid payload' using errcode='22023'; end if;
  if category in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN') and payload is not null then raise exception 'Payload is not supported for this category' using errcode='22023'; end if;
  if category in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN') and (value ? 'cargo_body' or value ? 'cargo_length_m' or value ? 'cargo_width_m' or value ? 'cargo_height_m') then raise exception 'Cargo capabilities are not supported for this category' using errcode='22023'; end if;
  if category in ('SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK') and passenger is not null then raise exception 'Passenger capacity is not supported for this category' using errcode='22023'; end if;
  return value;
end; $$;

create or replace function garilink_private.evaluate_vehicle_suitability(
  p_transport_need jsonb,
  p_capabilities jsonb
) returns jsonb language plpgsql immutable set search_path='' as $$
declare v_need jsonb; v_cargo jsonb; v_passengers integer; v_weight numeric;
  v_driver text; v_body text; v_satisfied jsonb := '[]'::jsonb;
  v_failed jsonb := '[]'::jsonb; v_unknown jsonb := '[]'::jsonb;
begin
  v_need := garilink_private.validate_transport_need(p_transport_need);
  if p_capabilities is null or jsonb_typeof(p_capabilities) <> 'object' then
    return jsonb_build_object('matchingVersion',1,'status','CANNOT_VERIFY','satisfiedRequirements',v_satisfied,'failedRequirements',v_failed,'unverifiableRequirements',jsonb_build_array('CAPABILITY_UNKNOWN'),'reasons',jsonb_build_array('CAPABILITY_UNKNOWN'));
  end if;
  if v_need ? 'passengerCount' then
    v_passengers := (v_need->>'passengerCount')::integer;
    if not (p_capabilities ? 'passenger_capacity') then v_unknown := v_unknown || jsonb_build_array('PASSENGER_CAPACITY_UNKNOWN');
    elsif (p_capabilities->>'passenger_capacity')::integer >= v_passengers then v_satisfied := v_satisfied || jsonb_build_array('PASSENGER_CAPACITY_OK');
    else v_failed := v_failed || jsonb_build_array('INSUFFICIENT_PASSENGER_CAPACITY'); end if;
  end if;
  v_cargo := v_need->'cargo';
  if v_cargo is not null and v_cargo ? 'estimatedWeightKg' then
    v_weight := (v_cargo->>'estimatedWeightKg')::numeric;
    if not (p_capabilities ? 'payload_kg') then v_unknown := v_unknown || jsonb_build_array('PAYLOAD_CAPACITY_UNKNOWN');
    elsif (p_capabilities->>'payload_kg')::numeric >= v_weight then v_satisfied := v_satisfied || jsonb_build_array('PAYLOAD_CAPACITY_OK');
    else v_failed := v_failed || jsonb_build_array('INSUFFICIENT_PAYLOAD_CAPACITY'); end if;
  end if;
  if v_cargo is not null and v_cargo ? 'estimatedVolumeM3' then
    v_unknown := v_unknown || jsonb_build_array('CARGO_VOLUME_UNVERIFIABLE');
  end if;
  if v_cargo is not null and coalesce((v_cargo->>'requiresCoveredBody')::boolean,false) then
    v_body := lower(coalesce(p_capabilities->>'cargo_body',''));
    if not (p_capabilities ? 'cargo_body') then v_unknown := v_unknown || jsonb_build_array('COVERED_CARGO_UNKNOWN');
    elsif v_body in ('covered','enclosed','box','box_truck','van') then v_satisfied := v_satisfied || jsonb_build_array('COVERED_CARGO_SUPPORTED');
    else v_failed := v_failed || jsonb_build_array('COVERED_CARGO_REQUIRED'); end if;
  end if;
  v_driver := coalesce(v_need->>'driverPreference','ANY');
  if v_driver = 'WITH_DRIVER' then
    if not (p_capabilities ? 'with_driver') then v_unknown := v_unknown || jsonb_build_array('WITH_DRIVER_UNKNOWN');
    elsif (p_capabilities->>'with_driver')::boolean then v_satisfied := v_satisfied || jsonb_build_array('DRIVER_AVAILABLE');
    else v_failed := v_failed || jsonb_build_array('DRIVER_REQUIRED_NOT_SUPPORTED'); end if;
  elsif v_driver = 'SELF_DRIVE' then
    if not (p_capabilities ? 'self_drive') then v_unknown := v_unknown || jsonb_build_array('SELF_DRIVE_UNKNOWN');
    elsif (p_capabilities->>'self_drive')::boolean then v_satisfied := v_satisfied || jsonb_build_array('SELF_DRIVE_AVAILABLE');
    else v_failed := v_failed || jsonb_build_array('SELF_DRIVE_NOT_SUPPORTED'); end if;
  end if;
  if coalesce((v_need->>'longDistance')::boolean,false) then
    if not (p_capabilities ? 'long_distance') then v_unknown := v_unknown || jsonb_build_array('LONG_DISTANCE_UNKNOWN');
    elsif (p_capabilities->>'long_distance')::boolean then v_satisfied := v_satisfied || jsonb_build_array('LONG_DISTANCE_SUPPORTED');
    else v_failed := v_failed || jsonb_build_array('LONG_DISTANCE_NOT_SUPPORTED'); end if;
  end if;
  return jsonb_build_object(
    'matchingVersion',1,
    'status',case when jsonb_array_length(v_failed)>0 then 'UNSUITABLE' when jsonb_array_length(v_unknown)>0 then 'CANNOT_VERIFY' else 'SUITABLE' end,
    'satisfiedRequirements',v_satisfied,'failedRequirements',v_failed,'unverifiableRequirements',v_unknown,
    'reasons',v_satisfied || v_failed || v_unknown
  );
end; $$;

create function public.garilink_v2_matched_vehicles(
  p_latitude double precision, p_longitude double precision, p_transport_need jsonb,
  p_radius_meters integer default 10000, p_limit integer default 20, p_offset integer default 0
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_origin extensions.geography; v_config jsonb; v_need jsonb;
begin
  v_config := garilink_private.nearby_config();
  v_need := garilink_private.validate_transport_need(p_transport_need);
  if p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'Invalid search location' using errcode='22023'; end if;
  if p_radius_meters is null or p_radius_meters < (v_config->>'minRadiusMeters')::integer or p_radius_meters > (v_config->>'maxRadiusMeters')::integer then raise exception 'Invalid search radius' using errcode='22023'; end if;
  if p_limit is null or p_limit not between 1 and (v_config->>'maxLimit')::integer then raise exception 'Invalid result limit' using errcode='22023'; end if;
  if p_offset is null or p_offset not between 0 and (v_config->>'maxOffset')::integer then raise exception 'Invalid result offset' using errcode='22023'; end if;
  v_origin := extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude,p_latitude),4326)::extensions.geography;
  return jsonb_build_object('data',coalesce((
    select jsonb_agg(row_json order by distance_meters,listing_id) from (
      select l.id listing_id, extensions.ST_Distance(v.operational_geog,v_origin) distance_meters,
        garilink_private.listing_json(l) || jsonb_build_object(
          'vehicleCategory',v.vehicle_category,'operationalAvailability',v.operational_availability,
          'capabilities',v.capabilities,'eligibility',garilink_private.v2_discovery_eligibility(v),
          'publicLocality',v.public_locality,
          'distanceMeters',round(extensions.ST_Distance(v.operational_geog,v_origin)/100.0)*100,
          'suitability',s.result
        ) row_json
      from public.gl_listings l join public.gl_vehicles v on v.id=l.vehicle_id
      cross join lateral (select garilink_private.evaluate_vehicle_suitability(v_need,v.capabilities) result) s
      where v.operational_geog is not null and l.type='FOR_HIRE' and l.status='PUBLISHED'
        and extensions.ST_DWithin(v.operational_geog,v_origin,p_radius_meters)
        and (garilink_private.v2_discovery_eligibility(v)->>'discoverable')::boolean
        and s.result->>'status'='SUITABLE'
      order by extensions.ST_Distance(v.operational_geog,v_origin),l.id
      limit p_limit offset p_offset
    ) matched
  ),'[]'::jsonb),'radiusMeters',p_radius_meters,'limit',p_limit,'offset',p_offset,'matchingVersion',1);
end; $$;

revoke all on function garilink_private.evaluate_vehicle_suitability(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.garilink_v2_matched_vehicles(double precision,double precision,jsonb,integer,integer,integer) from public;
grant execute on function public.garilink_v2_matched_vehicles(double precision,double precision,jsonb,integer,integer,integer) to anon,authenticated;

commit;
