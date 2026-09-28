begin;

-- Composes a trusted policy, dates and optional server-created RouteResult.
-- It never accepts a client total and never substitutes discovery distance.
create function garilink_private.rental_price_estimate_v1(
  p_policy jsonb, p_start date, p_end date, p_route_result jsonb default null)
returns jsonb language plpgsql stable set search_path='' as $$
declare v_eval jsonb; v_requires_route boolean; v_route_distance bigint;
begin
  if p_policy is null then
    return jsonb_build_object('status','PRICING_NOT_CONFIGURED','estimateVersion',1);
  end if;
  perform garilink_private.validate_rental_pricing_policy(p_policy);
  if p_start is null or p_end is null or p_end<=p_start or p_end>p_start+366 then
    raise exception 'Invalid rental dates' using errcode='22023';
  end if;
  v_requires_route:=p_policy ? 'distanceRateMinorPerKilometer';
  if v_requires_route then
    if p_route_result is null then
      return jsonb_build_object('status','INCOMPLETE_INPUT','estimateVersion',1,
        'pricingPolicyVersion',1,'currency','TZS','missingInputs',jsonb_build_array('ROUTE_DISTANCE'));
    end if;
    if p_route_result->>'status'<>'ROUTE_AVAILABLE' then
      return jsonb_build_object('status','ROUTE_UNAVAILABLE','estimateVersion',1,
        'pricingPolicyVersion',1,'currency','TZS');
    end if;
    begin
      if jsonb_typeof(p_route_result->'routeDistanceMeters')<>'number'
        or (p_route_result->>'routeCalculationVersion')::integer<>1 then raise exception 'invalid'; end if;
      v_route_distance:=(p_route_result->>'routeDistanceMeters')::bigint;
    exception when others then
      raise exception 'Invalid authoritative route result' using errcode='22023';
    end;
    if v_route_distance<0 or v_route_distance>10000000 then
      raise exception 'Invalid authoritative route result' using errcode='22023';
    end if;
  end if;
  v_eval:=garilink_private.evaluate_rental_pricing_v1(p_policy,
    jsonb_strip_nulls(jsonb_build_object('startDate',p_start,'endDate',p_end,
      'routeDistanceMeters',v_route_distance)));
  if v_eval->>'status'<>'ESTIMABLE' then return v_eval; end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'status','ESTIMATED','estimateVersion',1,'pricingPolicyVersion',1,
    'routeCalculationVersion',case when v_requires_route then 1 else null end,
    'currency','TZS','rentalDays',(v_eval->>'durationDays')::integer,
    'routeDistanceMeters',v_route_distance,'components',v_eval->'components',
    'rawAmountMinor',(v_eval->>'rawAmountMinor')::bigint,
    'finalEstimatedAmountMinor',(v_eval->>'finalEstimatedAmountMinor')::bigint,
    'calculatedAt',now()));
end; $$;

create function public.garilink_rental_estimate_context(
  p_listing_id uuid,p_start_date date,p_end_date date)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_actor uuid:=garilink_private.require_user(); l public.gl_listings;
  v public.gl_vehicles; p public.gl_vehicle_rental_pricing;
begin
  if p_start_date<=current_date or p_end_date<=p_start_date or p_end_date>p_start_date+366 then
    raise exception 'Invalid rental dates' using errcode='22023';
  end if;
  select * into l from public.gl_listings where id=p_listing_id;
  if not found or l.type<>'FOR_HIRE' or not garilink_private.listing_visible(l) then
    raise exception 'Listing not found' using errcode='PT404';
  end if;
  if exists(select 1 from public.gl_workspaces w where w.id=l.workspace_id and
    (w.owner_id=v_actor or exists(select 1 from public.gl_workspace_members m where m.workspace_id=w.id and m.user_id=v_actor and m.status='ACTIVE'))) then
    raise exception 'You cannot estimate your own vehicle' using errcode='42501';
  end if;
  select * into v from public.gl_vehicles where id=l.vehicle_id;
  if not found or (v.vehicle_category is not null and v.capabilities is not null and
    not coalesce((garilink_private.v2_discovery_eligibility(v)->>'requestable')::boolean,false)) then
    raise exception 'Vehicle is not currently available' using errcode='PT409';
  end if;
  select * into p from public.gl_vehicle_rental_pricing where vehicle_id=v.id;
  if not found then return jsonb_build_object('configured',false,'requiresRoute',false); end if;
  return jsonb_build_object('configured',true,
    'requiresRoute',p.distance_rate_minor_per_km is not null);
end; $$;

-- Called only by the Edge orchestration boundary with the authenticated actor
-- and, when applicable, the RouteProvider result it created server-side.
create function public.garilink_calculate_rental_estimate(
  p_actor_id uuid,p_listing_id uuid,p_start_date date,p_end_date date,p_route_result jsonb default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare l public.gl_listings; v public.gl_vehicles; p public.gl_vehicle_rental_pricing;
begin
  if p_actor_id is null or not exists(select 1 from public.gl_accounts a where a.id=p_actor_id) then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_start_date<=current_date or p_end_date<=p_start_date or p_end_date>p_start_date+366 then
    raise exception 'Invalid rental dates' using errcode='22023';
  end if;
  select * into l from public.gl_listings where id=p_listing_id;
  if not found or l.type<>'FOR_HIRE' or not garilink_private.listing_visible(l) then raise exception 'Listing not found' using errcode='PT404'; end if;
  if exists(select 1 from public.gl_workspaces w where w.id=l.workspace_id and
    (w.owner_id=p_actor_id or exists(select 1 from public.gl_workspace_members m where m.workspace_id=w.id and m.user_id=p_actor_id and m.status='ACTIVE'))) then
    raise exception 'You cannot estimate your own vehicle' using errcode='42501';
  end if;
  select * into v from public.gl_vehicles where id=l.vehicle_id;
  if not found or (v.vehicle_category is not null and v.capabilities is not null and
    not coalesce((garilink_private.v2_discovery_eligibility(v)->>'requestable')::boolean,false)) then
    raise exception 'Vehicle is not currently available' using errcode='PT409';
  end if;
  select * into p from public.gl_vehicle_rental_pricing where vehicle_id=v.id;
  if not found then return garilink_private.rental_price_estimate_v1(null,p_start_date,p_end_date,p_route_result); end if;
  return garilink_private.rental_price_estimate_v1(
    garilink_private.rental_pricing_policy_json(p)-'configured'-'vehicleId'-'updatedAt',
    p_start_date,p_end_date,p_route_result);
end; $$;

-- Replaces the current rental authority only to add an atomic estimate for
-- route-independent policies. Route-dependent snapshots remain null until the
-- live RouteProvider activation is certified.
create or replace function public.garilink_create_rental(input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=garilink_private.require_user(); r_item record;
  v_listing public.gl_listings; v_vehicle public.gl_vehicles; v_old public.gl_rentals;
  v_created public.gl_rentals; v_policy public.gl_vehicle_rental_pricing;
  v_request uuid; v_start date; v_end date; v_notes text; v_need jsonb;
  v_pickup jsonb; v_destination jsonb; v_canonical jsonb; v_suitability jsonb; v_estimate jsonb;
begin
  if input is null or jsonb_typeof(input)<>'object' then raise exception 'Invalid rental request' using errcode='22023'; end if;
  for r_item in select item.key,item.value from jsonb_each(input) item loop
    if r_item.key not in ('listingId','requestId','startDate','endDate','pickupNotes','transportNeed','pickupLocation','destinationLocation')
      or (r_item.key not in ('transportNeed','pickupLocation','destinationLocation') and jsonb_typeof(r_item.value)<>'string') then
      raise exception 'Invalid rental field' using errcode='22023'; end if;
  end loop;
  begin v_request:=(input->>'requestId')::uuid; v_start:=(input->>'startDate')::timestamptz::date; v_end:=(input->>'endDate')::timestamptz::date;
  exception when others then raise exception 'Invalid rental dates or request ID' using errcode='22023'; end;
  v_notes:=nullif(trim(input->>'pickupNotes'),'');
  v_need:=case when input ? 'transportNeed' then garilink_private.validate_transport_need(input->'transportNeed') end;
  v_pickup:=case when input ? 'pickupLocation' then garilink_private.validate_location(input->'pickupLocation') end;
  v_destination:=case when input ? 'destinationLocation' then garilink_private.validate_location(input->'destinationLocation') end;
  if v_start<=current_date or v_end<=v_start or v_end>v_start+366 or char_length(v_notes)>1000 then raise exception 'Invalid rental dates or notes' using errcode='22023'; end if;
  select * into v_listing from public.gl_listings where id=(input->>'listingId')::uuid for share;
  if not found or v_listing.type<>'FOR_HIRE' or not garilink_private.listing_visible(v_listing) then raise exception 'Listing not found' using errcode='PT404'; end if;
  v_canonical:=jsonb_build_object('listingId',v_listing.id,'startDate',v_start,'endDate',v_end,'pickupNotes',v_notes,
    'transportNeed',v_need,'pickupLocation',v_pickup,'destinationLocation',v_destination);
  perform pg_advisory_xact_lock(hashtextextended(v_actor::text,2));
  select * into v_old from public.gl_rentals where customer_id=v_actor and request_id=v_request;
  if found then
    if (v_old.request_payload||jsonb_build_object('transportNeed',v_old.transport_need_snapshot,'pickupLocation',v_old.pickup_location_snapshot,'destinationLocation',v_old.destination_location_snapshot))<>v_canonical
      then raise exception 'Request ID already used' using errcode='23505'; end if;
    return garilink_private.rental_json(v_old);
  end if;
  if exists(select 1 from public.gl_workspaces w where w.id=v_listing.workspace_id and
    (w.owner_id=v_actor or exists(select 1 from public.gl_workspace_members m where m.workspace_id=w.id and m.user_id=v_actor and m.status='ACTIVE')))
    then raise exception 'You cannot rent your own vehicle' using errcode='42501'; end if;
  select * into v_vehicle from public.gl_vehicles where id=v_listing.vehicle_id for share;
  if not found then raise exception 'Listing not found' using errcode='PT404'; end if;
  if v_vehicle.vehicle_category is not null and v_vehicle.capabilities is not null and
    not coalesce((garilink_private.v2_discovery_eligibility(v_vehicle)->>'requestable')::boolean,false)
    then raise exception 'Vehicle is not currently available for rental requests' using errcode='PT409'; end if;
  if v_need is not null and v_vehicle.vehicle_category is not null and v_vehicle.capabilities is not null then
    v_suitability:=garilink_private.evaluate_vehicle_suitability(v_need,v_vehicle.capabilities);
    if v_suitability->>'status'<>'SUITABLE' then raise exception 'Vehicle no longer matches these transport requirements' using errcode='PT409'; end if;
  end if;
  select * into v_policy from public.gl_vehicle_rental_pricing where vehicle_id=v_vehicle.id;
  if found and v_policy.distance_rate_minor_per_km is null then
    v_estimate:=garilink_private.rental_price_estimate_v1(
      garilink_private.rental_pricing_policy_json(v_policy)-'configured'-'vehicleId'-'updatedAt',v_start,v_end,null);
  end if;
  insert into public.gl_rentals(listing_id,vehicle_id,workspace_id,customer_id,request_id,request_payload,
    start_date,end_date,daily_rate,currency,total_amount,pickup_notes,transport_need_snapshot,
    pickup_location_snapshot,destination_location_snapshot,pricing_estimate_snapshot)
  values(v_listing.id,v_listing.vehicle_id,v_listing.workspace_id,v_actor,v_request,v_canonical,
    v_start,v_end,v_listing.price,v_listing.currency,v_listing.price*(v_end-v_start),v_notes,v_need,
    v_pickup,v_destination,v_estimate) returning * into v_created;
  return garilink_private.rental_json(v_created);
end; $$;

revoke all on function garilink_private.rental_price_estimate_v1(jsonb,date,date,jsonb) from public,anon,authenticated;
revoke all on function public.garilink_rental_estimate_context(uuid,date,date) from public,anon;
grant execute on function public.garilink_rental_estimate_context(uuid,date,date) to authenticated;
revoke all on function public.garilink_calculate_rental_estimate(uuid,uuid,date,date,jsonb) from public,anon,authenticated;
grant execute on function public.garilink_calculate_rental_estimate(uuid,uuid,date,date,jsonb) to service_role;

commit;
