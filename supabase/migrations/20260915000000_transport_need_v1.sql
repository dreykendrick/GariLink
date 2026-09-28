begin;

alter table public.gl_rentals add column if not exists transport_need_snapshot jsonb;
alter table public.gl_rentals add constraint gl_rentals_transport_need_object_check check (transport_need_snapshot is null or jsonb_typeof(transport_need_snapshot)='object');

create function garilink_private.validate_transport_need(p_need jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare r_item record; v_purpose text; v_passengers integer; v_cargo jsonb; v_weight numeric; v_volume numeric; v_notes text;
begin
 if p_need is null or jsonb_typeof(p_need)<>'object' then raise exception 'Invalid transport need' using errcode='22023'; end if;
 for r_item in select item.key,item.value from jsonb_each(p_need) as item loop
  if r_item.key not in ('schemaVersion','purpose','passengerCount','cargo','driverPreference','longDistance','returnTrip','notes') then raise exception 'Unsupported transport need field' using errcode='22023'; end if;
 end loop;
 if jsonb_typeof(p_need->'schemaVersion')<>'number' or (p_need->>'schemaVersion')::int<>1 then raise exception 'Unsupported transport need schema' using errcode='22023'; end if;
 v_purpose:=p_need->>'purpose'; if v_purpose not in ('PERSONAL_TRIP','CITY_TRAVEL','FAMILY_OR_GROUP','AIRPORT_TRANSFER','PARCEL_DELIVERY','SMALL_CARGO','MOVING_GOODS','BUSINESS_TRANSPORT','REGIONAL_CARGO','HEAVY_CARGO','LONG_DISTANCE') then raise exception 'Unsupported transport purpose' using errcode='22023'; end if;
 if p_need ? 'passengerCount' then if jsonb_typeof(p_need->'passengerCount')<>'number' then raise exception 'Invalid passenger count' using errcode='22023'; end if; v_passengers:=(p_need->>'passengerCount')::int; if v_passengers not between 1 and 100 then raise exception 'Invalid passenger count' using errcode='22023'; end if; end if;
 if p_need ? 'driverPreference' and p_need->>'driverPreference' not in ('ANY','WITH_DRIVER','SELF_DRIVE') then raise exception 'Invalid driver preference' using errcode='22023'; end if;
 if p_need ? 'longDistance' and jsonb_typeof(p_need->'longDistance')<>'boolean' then raise exception 'Invalid long-distance value' using errcode='22023'; end if;
 if p_need ? 'returnTrip' and jsonb_typeof(p_need->'returnTrip')<>'boolean' then raise exception 'Invalid return-trip value' using errcode='22023'; end if;
 if p_need ? 'notes' then if jsonb_typeof(p_need->'notes')<>'string' then raise exception 'Invalid transport notes' using errcode='22023'; end if; v_notes:=p_need->>'notes'; if char_length(v_notes)>1000 then raise exception 'Transport notes are too long' using errcode='22023'; end if; end if;
 if p_need ? 'cargo' then v_cargo:=p_need->'cargo'; if jsonb_typeof(v_cargo)<>'object' then raise exception 'Invalid cargo requirement' using errcode='22023'; end if; for r_item in select item.key,item.value from jsonb_each(v_cargo) as item loop if r_item.key not in ('estimatedWeightKg','estimatedVolumeM3','cargoType','fragile','requiresCoveredBody') then raise exception 'Unsupported cargo field' using errcode='22023'; end if; end loop; if v_cargo ? 'estimatedWeightKg' then if jsonb_typeof(v_cargo->'estimatedWeightKg')<>'number' or (v_cargo->>'estimatedWeightKg')::numeric<0 then raise exception 'Invalid cargo weight' using errcode='22023'; end if; end if; if v_cargo ? 'estimatedVolumeM3' then if jsonb_typeof(v_cargo->'estimatedVolumeM3')<>'number' or (v_cargo->>'estimatedVolumeM3')::numeric<0 then raise exception 'Invalid cargo volume' using errcode='22023'; end if; end if; end if;
 if v_purpose in ('PARCEL_DELIVERY','SMALL_CARGO','MOVING_GOODS','REGIONAL_CARGO','HEAVY_CARGO') and v_cargo is null then raise exception 'Add cargo details for this transport need' using errcode='22023'; end if;
 return p_need;
end; $$;

create or replace function public.garilink_create_rental(input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=garilink_private.require_user(); r_item record; v_listing public.gl_listings; v_old public.gl_rentals; v_created public.gl_rentals; v_request uuid; v_start date; v_end date; v_notes text; v_need jsonb; v_canonical jsonb;
begin
 if input is null or jsonb_typeof(input)<>'object' then raise exception 'Invalid rental request' using errcode='22023'; end if;
 for r_item in select item.key,item.value from jsonb_each(input) as item loop if r_item.key not in ('listingId','requestId','startDate','endDate','pickupNotes','transportNeed') or (r_item.key<>'transportNeed' and jsonb_typeof(r_item.value)<>'string') then raise exception 'Invalid rental field' using errcode='22023'; end if; end loop;
 begin v_request:=(input->>'requestId')::uuid;v_start:=(input->>'startDate')::timestamptz::date;v_end:=(input->>'endDate')::timestamptz::date; exception when others then raise exception 'Invalid rental dates or request ID' using errcode='22023'; end;
 v_notes:=nullif(trim(input->>'pickupNotes'),'');v_need:=case when input ? 'transportNeed' then garilink_private.validate_transport_need(input->'transportNeed') else null end;
 if v_start<=current_date or v_end<=v_start or v_end>v_start+366 or char_length(v_notes)>1000 then raise exception 'Invalid rental dates or notes' using errcode='22023'; end if;
 select l.* into v_listing from public.gl_listings l where l.id=(input->>'listingId')::uuid for share; if not found or v_listing.type<>'FOR_HIRE' or not garilink_private.listing_visible(v_listing) then raise exception 'Listing not found' using errcode='PT404'; end if; if exists(select 1 from public.gl_workspaces w where w.id=v_listing.workspace_id and (w.owner_id=v_actor or exists(select 1 from public.gl_workspace_members m where m.workspace_id=w.id and m.user_id=v_actor and m.status='ACTIVE'))) then raise exception 'You cannot rent your own vehicle' using errcode='42501'; end if;
 v_canonical:=jsonb_build_object('listingId',v_listing.id,'startDate',v_start,'endDate',v_end,'pickupNotes',v_notes,'transportNeed',v_need); perform pg_advisory_xact_lock(hashtextextended(v_actor::text,2)); select r.* into v_old from public.gl_rentals r where r.customer_id=v_actor and r.request_id=v_request; if found then if v_old.request_payload<>v_canonical then raise exception 'Request ID already used' using errcode='23505'; end if; return garilink_private.rental_json(v_old); end if;
 insert into public.gl_rentals(listing_id,vehicle_id,workspace_id,customer_id,request_id,request_payload,start_date,end_date,daily_rate,currency,total_amount,pickup_notes,transport_need_snapshot) values(v_listing.id,v_listing.vehicle_id,v_listing.workspace_id,v_actor,v_request,v_canonical,v_start,v_end,v_listing.price,v_listing.currency,v_listing.price*(v_end-v_start),v_notes,v_need) returning * into v_created; return garilink_private.rental_json(v_created);
end; $$;
commit;
