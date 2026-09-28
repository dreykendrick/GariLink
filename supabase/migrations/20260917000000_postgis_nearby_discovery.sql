begin;

create extension if not exists postgis with schema extensions;

alter table public.gl_vehicles
  add column if not exists operational_geog extensions.geography(Point,4326);

create or replace function garilink_private.sync_vehicle_operational_geog()
returns trigger language plpgsql set search_path='' as $$
declare v_lat double precision; v_lng double precision;
begin
  new.operational_geog:=null;
  if new.operational_location is null then return new; end if;
  if not (new.operational_location ? 'latitude' and new.operational_location ? 'longitude') then return new; end if;
  v_lat:=(new.operational_location->>'latitude')::double precision;
  v_lng:=(new.operational_location->>'longitude')::double precision;
  new.operational_geog:=extensions.ST_SetSRID(extensions.ST_MakePoint(v_lng,v_lat),4326)::extensions.geography;
  return new;
end; $$;

drop trigger if exists gl_vehicles_operational_geog_sync on public.gl_vehicles;
create trigger gl_vehicles_operational_geog_sync
before insert or update of operational_location on public.gl_vehicles
for each row execute function garilink_private.sync_vehicle_operational_geog();

update public.gl_vehicles set operational_location=operational_location
where operational_location ? 'latitude' and operational_location ? 'longitude';

create index if not exists gl_vehicles_operational_geog_gist
  on public.gl_vehicles using gist (operational_geog)
  where operational_geog is not null;

create function garilink_private.nearby_config()
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object('defaultRadiusMeters',10000,'minRadiusMeters',500,
    'maxRadiusMeters',100000,'defaultLimit',20,'maxLimit',50,'maxOffset',1000);
$$;

create function public.garilink_v2_nearby_vehicles(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer default 10000,
  p_limit integer default 20,
  p_offset integer default 0
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_origin extensions.geography; v_config jsonb;
begin
  v_config:=garilink_private.nearby_config();
  if p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180
  then raise exception 'Invalid search location' using errcode='22023'; end if;
  if p_radius_meters is null or p_radius_meters < (v_config->>'minRadiusMeters')::integer
    or p_radius_meters > (v_config->>'maxRadiusMeters')::integer
  then raise exception 'Invalid search radius' using errcode='22023'; end if;
  if p_limit is null or p_limit not between 1 and (v_config->>'maxLimit')::integer
  then raise exception 'Invalid result limit' using errcode='22023'; end if;
  if p_offset is null or p_offset not between 0 and (v_config->>'maxOffset')::integer
  then raise exception 'Invalid result offset' using errcode='22023'; end if;
  v_origin:=extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude,p_latitude),4326)::extensions.geography;
  return jsonb_build_object(
    'data',coalesce((
      select jsonb_agg(row_json order by distance_meters,listing_id)
      from (
        select l.id as listing_id,
          garilink_private.listing_json(l)||jsonb_build_object(
            'vehicleCategory',v.vehicle_category,
            'operationalAvailability',v.operational_availability,
            'capabilities',v.capabilities,
            'eligibility',garilink_private.v2_discovery_eligibility(v),
            'publicLocality',v.public_locality,
            'distanceMeters',round(extensions.ST_Distance(v.operational_geog,v_origin)/100.0)*100
          ) as row_json,
          extensions.ST_Distance(v.operational_geog,v_origin) as distance_meters
        from public.gl_listings l
        join public.gl_vehicles v on v.id=l.vehicle_id
        where v.operational_geog is not null
          and l.type='FOR_HIRE' and l.status='PUBLISHED'
          and extensions.ST_DWithin(v.operational_geog,v_origin,p_radius_meters)
          and (garilink_private.v2_discovery_eligibility(v)->>'discoverable')::boolean
        order by extensions.ST_Distance(v.operational_geog,v_origin),l.id
        limit p_limit offset p_offset
      ) nearby
    ),'[]'::jsonb),
    'radiusMeters',p_radius_meters,'limit',p_limit,'offset',p_offset
  );
end; $$;

revoke all on function garilink_private.sync_vehicle_operational_geog() from public,anon,authenticated;
revoke all on function garilink_private.nearby_config() from public,anon,authenticated;
revoke all on function public.garilink_v2_nearby_vehicles(double precision,double precision,integer,integer,integer) from public;
grant execute on function public.garilink_v2_nearby_vehicles(double precision,double precision,integer,integer,integer) to anon,authenticated;

commit;
