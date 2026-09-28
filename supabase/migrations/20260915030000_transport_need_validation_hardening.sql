begin;
create or replace function garilink_private.validate_transport_need(p_need jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare r_item record; v_cargo jsonb; v_is_cargo boolean;
begin
 if jsonb_typeof(p_need) is distinct from 'object' then raise exception 'Invalid transport need' using errcode='22023'; end if;
 if p_need->'schemaVersion' is distinct from '1'::jsonb then raise exception 'Unsupported transport need schema' using errcode='22023'; end if;
 if jsonb_typeof(p_need->'purpose') is distinct from 'string' or not (p_need->>'purpose'=any(array['PERSONAL_TRIP','CITY_TRAVEL','FAMILY_OR_GROUP','AIRPORT_TRANSFER','PARCEL_DELIVERY','SMALL_CARGO','MOVING_GOODS','BUSINESS_TRANSPORT','REGIONAL_CARGO','HEAVY_CARGO','LONG_DISTANCE'])) then raise exception 'Unsupported transport purpose' using errcode='22023'; end if;
 for r_item in select j.key,j.value from jsonb_each(p_need) j loop
  if r_item.key not in ('schemaVersion','purpose','passengerCount','cargo','driverPreference','longDistance','returnTrip','notes') then raise exception 'Unsupported transport need field' using errcode='22023'; end if;
  if r_item.key in ('longDistance','returnTrip') and jsonb_typeof(r_item.value)<>'boolean' then raise exception 'Invalid trip flag' using errcode='22023'; end if;
 end loop;
 if p_need ? 'passengerCount' then
  if jsonb_typeof(p_need->'passengerCount')<>'number' then raise exception 'Invalid passenger count' using errcode='22023'; end if;
  if (p_need->>'passengerCount')::numeric not between 1 and 100 or trunc((p_need->>'passengerCount')::numeric)<>(p_need->>'passengerCount')::numeric then raise exception 'Invalid passenger count' using errcode='22023'; end if;
 end if;
 if p_need ? 'driverPreference' and (jsonb_typeof(p_need->'driverPreference')<>'string' or not(p_need->>'driverPreference'=any(array['ANY','WITH_DRIVER','SELF_DRIVE']))) then raise exception 'Invalid driver preference' using errcode='22023'; end if;
 if p_need ? 'notes' and (jsonb_typeof(p_need->'notes')<>'string' or char_length(p_need->>'notes')>1000) then raise exception 'Invalid transport notes' using errcode='22023'; end if;
 v_is_cargo:=p_need->>'purpose'=any(array['PARCEL_DELIVERY','SMALL_CARGO','MOVING_GOODS','REGIONAL_CARGO','HEAVY_CARGO']);
 if v_is_cargo and not(p_need ? 'cargo') then raise exception 'Add cargo details' using errcode='22023'; end if;
 if v_is_cargo and p_need ? 'passengerCount' then raise exception 'Passenger count is not applicable to cargo transport' using errcode='22023'; end if;
 if p_need ? 'cargo' then
  if not v_is_cargo or jsonb_typeof(p_need->'cargo')<>'object' then raise exception 'Invalid cargo requirement' using errcode='22023'; end if;
  v_cargo:=p_need->'cargo';
  for r_item in select j.key,j.value from jsonb_each(v_cargo) j loop
   if r_item.key not in ('estimatedWeightKg','estimatedVolumeM3','cargoType','fragile','requiresCoveredBody') then raise exception 'Unsupported cargo field' using errcode='22023'; end if;
   if r_item.key in ('estimatedWeightKg','estimatedVolumeM3') then
    if jsonb_typeof(r_item.value)<>'number' then raise exception 'Invalid cargo amount' using errcode='22023'; end if;
    if (r_item.value::text)::numeric<0 then raise exception 'Invalid cargo amount' using errcode='22023'; end if;
   end if;
   if r_item.key in ('fragile','requiresCoveredBody') and jsonb_typeof(r_item.value)<>'boolean' then raise exception 'Invalid cargo flag' using errcode='22023'; end if;
   if r_item.key='cargoType' and (jsonb_typeof(r_item.value)<>'string' or char_length(v_cargo->>'cargoType')>200) then raise exception 'Invalid cargo description' using errcode='22023'; end if;
  end loop;
 end if;
 return p_need;
end; $$;
revoke all on function garilink_private.validate_transport_need(jsonb) from public,anon,authenticated;
commit;
