begin;

-- PostgREST surfaced a second ambiguity in the record-source column name.
-- Use an explicit JSON-record alias while retaining the deployed signature.
create or replace function garilink_private.validate_vehicle_capabilities(category text, value jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare item record; schema_version int; passenger integer; payload numeric;
begin
  if category not in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN','PICKUP','SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK')
    or validate_vehicle_capabilities.value is null or jsonb_typeof(validate_vehicle_capabilities.value) <> 'object' then
    raise exception 'Invalid vehicle category or capabilities' using errcode='22023'; end if;
  begin schema_version := (validate_vehicle_capabilities.value->>'schema_version')::int;
  exception when others then raise exception 'Invalid capability schema version' using errcode='22023'; end;
  if schema_version <> 1 then raise exception 'Unsupported capability schema version' using errcode='22023'; end if;
  for item in select capability.key, capability.value from jsonb_each(validate_vehicle_capabilities.value) as capability loop
    if item.key not in ('schema_version','transmission','fuel_type','self_drive','with_driver','passenger_capacity','payload_kg','cargo_body','cargo_length_m','cargo_width_m','cargo_height_m') then
      raise exception 'Unsupported vehicle capability' using errcode='22023'; end if;
    if item.key in ('transmission','fuel_type','cargo_body') and jsonb_typeof(item.value) <> 'string' then raise exception 'Invalid vehicle capability type' using errcode='22023'; end if;
    if item.key in ('self_drive','with_driver') and jsonb_typeof(item.value) <> 'boolean' then raise exception 'Invalid vehicle capability type' using errcode='22023'; end if;
    if item.key in ('passenger_capacity','payload_kg','cargo_length_m','cargo_width_m','cargo_height_m') and jsonb_typeof(item.value) <> 'number' then raise exception 'Invalid vehicle capability type' using errcode='22023'; end if;
  end loop;
  begin passenger := (validate_vehicle_capabilities.value->>'passenger_capacity')::int; payload := (validate_vehicle_capabilities.value->>'payload_kg')::numeric;
  exception when others then raise exception 'Invalid vehicle capability value' using errcode='22023'; end;
  if passenger is not null and passenger not between 1 and 100 then raise exception 'Invalid passenger capacity' using errcode='22023'; end if;
  if payload is not null and payload < 0 then raise exception 'Invalid payload' using errcode='22023'; end if;
  if category in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN') and payload is not null then raise exception 'Payload is not supported for this category' using errcode='22023'; end if;
  if category in ('SEDAN','HATCHBACK','SUV','MINIVAN','VAN') and (validate_vehicle_capabilities.value ? 'cargo_body' or validate_vehicle_capabilities.value ? 'cargo_length_m' or validate_vehicle_capabilities.value ? 'cargo_width_m' or validate_vehicle_capabilities.value ? 'cargo_height_m') then raise exception 'Cargo capabilities are not supported for this category' using errcode='22023'; end if;
  if category in ('SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK') and passenger is not null then raise exception 'Passenger capacity is not supported for this category' using errcode='22023'; end if;
  return validate_vehicle_capabilities.value;
end;
$$;

commit;
