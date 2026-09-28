begin;
create or replace function garilink_private.rental_json(r public.gl_rentals, include_customer boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'id',r.id,'workspaceId',r.workspace_id,'listingId',r.listing_id,'vehicleId',r.vehicle_id,
 'status',r.status,'startDate',r.start_date,'endDate',r.end_date,'dailyRate',r.daily_rate,
 'currency',r.currency,'totalAmount',r.total_amount,'depositAmount',r.deposit_amount,
 'pickupNotes',r.pickup_notes,'rejectionReason',r.rejection_reason,'transportNeed',r.transport_need_snapshot,
 'pickupLocation',r.pickup_location_snapshot,'destinationLocation',r.destination_location_snapshot,
 'createdAt',r.created_at,'updatedAt',r.updated_at,
 'listing',jsonb_build_object('id',l.id,'title',l.title,'county',l.county,'vehicle',garilink_private.vehicle_json(v)),
 'customer',case when include_customer then jsonb_build_object('id',r.customer_id,
 'displayName',coalesce(nullif(p.display_name,''),nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'GariLink customer'),
 'phoneNumber',case when u.phone is null or u.phone='' then '' else '+'||ltrim(u.phone,'+') end,'photoUrl',null) else null end)
 from public.gl_listings l join public.gl_vehicles v on v.id=r.vehicle_id
 join public.gl_profiles p on p.user_id=r.customer_id join auth.users u on u.id=r.customer_id where l.id=r.listing_id;
$$;

create function garilink_private.protect_rental_locations() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.pickup_location_snapshot is distinct from old.pickup_location_snapshot
 or new.destination_location_snapshot is distinct from old.destination_location_snapshot then
 raise exception 'Rental locations cannot be changed after submission' using errcode='22023';
 end if;
 return new;
end; $$;
create trigger gl_rentals_locations_immutable before update on public.gl_rentals
for each row execute function garilink_private.protect_rental_locations();
revoke all on function garilink_private.protect_rental_locations() from public,anon,authenticated;
-- Preserve the existing RPC argument name; delegate validation to a strict helper.
create function garilink_private.validate_location_v1(p_location jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare r_field record; v_timestamp timestamptz;
begin
 if p_location is null or jsonb_typeof(p_location)<>'object'
 or p_location->'schemaVersion' is distinct from '1'::jsonb
 or jsonb_typeof(p_location->'source') is distinct from 'string'
 or p_location->>'source' not in ('DEVICE','MANUAL','PLACE_SELECTION','OWNER_CONFIGURED','SYSTEM_DERIVED')
 then raise exception 'Invalid location version or source' using errcode='22023'; end if;
 for r_field in select j.key,j.value from jsonb_each(p_location) j loop
  if r_field.key not in ('schemaVersion','latitude','longitude','locality','city','region','countryCode','source','accuracyMeters','capturedAt')
  then raise exception 'Unsupported location field' using errcode='22023'; end if;
  if r_field.key in ('latitude','longitude','accuracyMeters') then
   if jsonb_typeof(r_field.value)<>'number' then raise exception 'Invalid location number' using errcode='22023'; end if;
   if (r_field.key='latitude' and (r_field.value::text)::numeric not between -90 and 90)
   or (r_field.key='longitude' and (r_field.value::text)::numeric not between -180 and 180)
   or (r_field.key='accuracyMeters' and (r_field.value::text)::numeric<0)
   then raise exception 'Invalid location range' using errcode='22023'; end if;
  elsif r_field.key<>'schemaVersion' then
   if jsonb_typeof(r_field.value)<>'string' or length(trim(r_field.value #>> '{}')) not between 1 and 100
   then raise exception 'Invalid location text' using errcode='22023'; end if;
  end if;
 end loop;
 if (p_location ? 'latitude') <> (p_location ? 'longitude') then raise exception 'Provide both coordinates' using errcode='22023'; end if;
 if p_location ? 'countryCode' and p_location->>'countryCode' !~ '^[A-Z]{2}$'
 then raise exception 'Invalid country code' using errcode='22023'; end if;
 if p_location ? 'capturedAt' then
  begin v_timestamp:=(p_location->>'capturedAt')::timestamptz;
   if not isfinite(v_timestamp) then raise exception 'invalid'; end if;
  exception when others then raise exception 'Invalid location timestamp' using errcode='22023'; end;
 end if;
 return p_location;
end; $$;
create or replace function garilink_private.validate_location(input_value jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select garilink_private.validate_location_v1(input_value);
$$;
create function public.garilink_v2_vehicle_location(p_vehicle_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_vehicle public.gl_vehicles;
begin
 select v.* into v_vehicle from public.gl_vehicles v where v.id=p_vehicle_id;
 if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
 perform garilink_private.workspace_access(v_vehicle.workspace_id);
 return jsonb_build_object('publicLocality',v_vehicle.public_locality,'operationalLocation',v_vehicle.operational_location);
end; $$;
revoke all on function garilink_private.validate_location_v1(jsonb) from public,anon,authenticated;
revoke all on function public.garilink_v2_vehicle_location(uuid) from public,anon;
grant execute on function public.garilink_v2_vehicle_location(uuid) to authenticated;
create or replace function public.garilink_v2_discoverable_vehicles()
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(
 garilink_private.listing_json(l) || jsonb_build_object(
 'vehicleCategory',v.vehicle_category,'operationalAvailability',v.operational_availability,
 'capabilities',v.capabilities,'eligibility',garilink_private.v2_discovery_eligibility(v),
 'publicLocality',v.public_locality)
 order by l.created_at desc,l.id),'[]'::jsonb)
 from public.gl_listings l join public.gl_vehicles v on v.id=l.vehicle_id
 where l.type='FOR_HIRE' and l.status='PUBLISHED'
 and (garilink_private.v2_discovery_eligibility(v)->>'discoverable')::boolean;
$$;
commit;
