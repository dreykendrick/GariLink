begin;

-- Pricing Policy V1 is vehicle-scoped, exact-integer TZS configuration.
-- One stored minor unit equals one TZS for the only V1 currency. Existing
-- listing.price/rental totals remain legacy daily-rate history and are not
-- backfilled into this new policy domain.
create table public.gl_vehicle_rental_pricing (
  vehicle_id uuid primary key references public.gl_vehicles(id) on delete cascade,
  workspace_id uuid not null references public.gl_workspaces(id),
  policy_version smallint not null default 1 check (policy_version = 1),
  currency text not null check (currency = 'TZS'),
  base_charge_minor bigint,
  minimum_charge_minor bigint,
  duration_rate_minor_per_day bigint,
  distance_rate_minor_per_km bigint,
  updated_by uuid not null references public.gl_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (vehicle_id,workspace_id) references public.gl_vehicles(id,workspace_id),
  check (base_charge_minor is null or base_charge_minor between 0 and 999999999999),
  check (minimum_charge_minor is null or minimum_charge_minor between 0 and 999999999999),
  check (duration_rate_minor_per_day is null or duration_rate_minor_per_day between 0 and 999999999999),
  check (distance_rate_minor_per_km is null or distance_rate_minor_per_km between 0 and 999999999999),
  check (greatest(coalesce(base_charge_minor,0),coalesce(minimum_charge_minor,0),
    coalesce(duration_rate_minor_per_day,0),coalesce(distance_rate_minor_per_km,0)) > 0),
  check (minimum_charge_minor is null or minimum_charge_minor >= coalesce(base_charge_minor,0))
);
create index gl_vehicle_rental_pricing_workspace on public.gl_vehicle_rental_pricing(workspace_id,vehicle_id);
alter table public.gl_vehicle_rental_pricing enable row level security;
revoke all on public.gl_vehicle_rental_pricing from public,anon,authenticated;

alter table public.gl_rentals
  add column pricing_estimate_snapshot jsonb;

create function garilink_private.validate_rental_pricing_policy(p_policy jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare r_field record; v_version integer; v_currency text; v_value numeric;
  v_base bigint; v_minimum bigint; v_duration bigint; v_distance bigint;
begin
  if p_policy is null or jsonb_typeof(p_policy)<>'object' then
    raise exception 'Enter a valid rental pricing policy.' using errcode='22023';
  end if;
  for r_field in select j.key,j.value from jsonb_each(p_policy) j loop
    if r_field.key not in ('policyVersion','currency','baseChargeMinor','minimumChargeMinor','durationRateMinorPerDay','distanceRateMinorPerKilometer') then
      raise exception 'Unsupported rental pricing field.' using errcode='22023';
    end if;
    if r_field.key in ('policyVersion','baseChargeMinor','minimumChargeMinor','durationRateMinorPerDay','distanceRateMinorPerKilometer')
      and jsonb_typeof(r_field.value)<>'number' then
      raise exception 'Rental pricing amounts must be whole numbers.' using errcode='22023';
    end if;
  end loop;
  begin
    v_version := (p_policy->>'policyVersion')::integer;
    v_currency := p_policy->>'currency';
    if p_policy ? 'baseChargeMinor' then v_base := (p_policy->>'baseChargeMinor')::bigint; end if;
    if p_policy ? 'minimumChargeMinor' then v_minimum := (p_policy->>'minimumChargeMinor')::bigint; end if;
    if p_policy ? 'durationRateMinorPerDay' then v_duration := (p_policy->>'durationRateMinorPerDay')::bigint; end if;
    if p_policy ? 'distanceRateMinorPerKilometer' then v_distance := (p_policy->>'distanceRateMinorPerKilometer')::bigint; end if;
  exception when others then
    raise exception 'Rental pricing amounts must be whole numbers.' using errcode='22023';
  end;
  if v_version<>1 then raise exception 'Unsupported rental pricing policy version.' using errcode='22023'; end if;
  if v_currency<>'TZS' then raise exception 'Unsupported rental pricing currency.' using errcode='22023'; end if;
  for r_field in select j.key,j.value from jsonb_each(p_policy) j
    where j.key in ('baseChargeMinor','minimumChargeMinor','durationRateMinorPerDay','distanceRateMinorPerKilometer') loop
    v_value := (r_field.value::text)::numeric;
    if v_value<>trunc(v_value) or v_value<0 or v_value>999999999999 then
      raise exception 'Rental pricing amount is outside the supported range.' using errcode='22023';
    end if;
  end loop;
  if greatest(coalesce(v_base,0),coalesce(v_minimum,0),coalesce(v_duration,0),coalesce(v_distance,0))=0 then
    raise exception 'Configure at least one rental pricing component.' using errcode='22023';
  end if;
  if v_minimum is not null and v_minimum<coalesce(v_base,0) then
    raise exception 'Minimum charge cannot be below the base charge.' using errcode='22023';
  end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'policyVersion',1,'currency','TZS','baseChargeMinor',v_base,
    'minimumChargeMinor',v_minimum,'durationRateMinorPerDay',v_duration,
    'distanceRateMinorPerKilometer',v_distance));
end; $$;

create function garilink_private.rental_pricing_policy_json(p public.gl_vehicle_rental_pricing)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'configured',true,'vehicleId',p.vehicle_id,'policyVersion',p.policy_version,
    'currency',p.currency,'baseChargeMinor',p.base_charge_minor,
    'minimumChargeMinor',p.minimum_charge_minor,
    'durationRateMinorPerDay',p.duration_rate_minor_per_day,
    'distanceRateMinorPerKilometer',p.distance_rate_minor_per_km,
    'updatedAt',p.updated_at));
$$;

create function garilink_private.rental_pricing_summary(v public.gl_vehicles)
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce((select jsonb_strip_nulls(jsonb_build_object(
    'configured',true,'policyVersion',p.policy_version,'currency',p.currency,
    'baseChargeMinor',p.base_charge_minor,'minimumChargeMinor',p.minimum_charge_minor,
    'durationRateMinorPerDay',p.duration_rate_minor_per_day,
    'distanceRateMinorPerKilometer',p.distance_rate_minor_per_km))
    from public.gl_vehicle_rental_pricing p where p.vehicle_id=v.id),
    jsonb_build_object('configured',false));
$$;

create function public.garilink_vehicle_rental_pricing(p_vehicle_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v public.gl_vehicles; p public.gl_vehicle_rental_pricing;
begin
  select * into v from public.gl_vehicles where id=p_vehicle_id;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  perform garilink_private.workspace_access(v.workspace_id);
  select * into p from public.gl_vehicle_rental_pricing where vehicle_id=v.id;
  if not found then return jsonb_build_object('configured',false,'vehicleId',v.id); end if;
  return garilink_private.rental_pricing_policy_json(p);
end; $$;

create function public.garilink_update_vehicle_rental_pricing(p_vehicle_id uuid,p_policy jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.gl_vehicles; p public.gl_vehicle_rental_pricing; v_actor uuid; c jsonb;
begin
  select * into v from public.gl_vehicles where id=p_vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  v_actor:=garilink_private.workspace_access(v.workspace_id,true);
  perform garilink_private.require_capability(v_actor,'MANAGE_RENTAL_LISTINGS');
  c:=garilink_private.validate_rental_pricing_policy(p_policy);
  insert into public.gl_vehicle_rental_pricing(
    vehicle_id,workspace_id,policy_version,currency,base_charge_minor,
    minimum_charge_minor,duration_rate_minor_per_day,distance_rate_minor_per_km,updated_by)
  values(v.id,v.workspace_id,(c->>'policyVersion')::smallint,c->>'currency',
    (c->>'baseChargeMinor')::bigint,(c->>'minimumChargeMinor')::bigint,
    (c->>'durationRateMinorPerDay')::bigint,(c->>'distanceRateMinorPerKilometer')::bigint,v_actor)
  on conflict(vehicle_id) do update set
    policy_version=excluded.policy_version,currency=excluded.currency,
    base_charge_minor=excluded.base_charge_minor,minimum_charge_minor=excluded.minimum_charge_minor,
    duration_rate_minor_per_day=excluded.duration_rate_minor_per_day,
    distance_rate_minor_per_km=excluded.distance_rate_minor_per_km,
    updated_by=excluded.updated_by,updated_at=now()
  returning * into p;
  return garilink_private.rental_pricing_policy_json(p);
end; $$;

-- Pure/versioned calculation boundary. Distance is canonical integer metres.
-- A distance-priced policy without route distance is explicitly incomplete.
create function garilink_private.evaluate_rental_pricing_v1(p_policy jsonb,p_input jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare c jsonb; r_field record; v_start date; v_end date; v_days integer;
  v_distance bigint; v_base bigint; v_duration bigint; v_distance_amount bigint;
  v_raw bigint; v_minimum bigint; v_adjustment bigint; v_final bigint;
begin
  c:=garilink_private.validate_rental_pricing_policy(p_policy);
  if p_input is null or jsonb_typeof(p_input)<>'object' then raise exception 'Invalid rental pricing input.' using errcode='22023'; end if;
  for r_field in select j.key from jsonb_each(p_input) j loop
    if r_field.key not in ('startDate','endDate','routeDistanceMeters') then raise exception 'Unsupported rental pricing input.' using errcode='22023'; end if;
  end loop;
  begin v_start:=(p_input->>'startDate')::date; v_end:=(p_input->>'endDate')::date;
    if p_input ? 'routeDistanceMeters' then v_distance:=(p_input->>'routeDistanceMeters')::bigint; end if;
  exception when others then raise exception 'Invalid rental pricing input.' using errcode='22023'; end;
  v_days:=v_end-v_start;
  if v_days<1 or v_days>366 or v_distance<0 or v_distance>10000000 then raise exception 'Invalid rental pricing input.' using errcode='22023'; end if;
  if c ? 'distanceRateMinorPerKilometer' and v_distance is null then
    return jsonb_build_object('status','INCOMPLETE_INPUT','policyVersion',1,'currency','TZS','missingInputs',jsonb_build_array('ROUTE_DISTANCE_METERS'));
  end if;
  v_base:=coalesce((c->>'baseChargeMinor')::bigint,0);
  v_duration:=coalesce((c->>'durationRateMinorPerDay')::bigint,0)*v_days;
  -- Half-up rounding of the exact rate * integer metres / 1000.
  v_distance_amount:=case when c ? 'distanceRateMinorPerKilometer'
    then floor(((c->>'distanceRateMinorPerKilometer')::numeric*v_distance)/1000+0.5)::bigint else 0 end;
  v_raw:=v_base+v_duration+v_distance_amount;
  v_minimum:=coalesce((c->>'minimumChargeMinor')::bigint,0);
  v_adjustment:=greatest(v_minimum-v_raw,0);
  v_final:=v_raw+v_adjustment;
  return jsonb_build_object('status','ESTIMABLE','policyVersion',1,'currency','TZS',
    'durationDays',v_days,'routeDistanceMeters',v_distance,
    'components',jsonb_build_object('baseChargeMinor',v_base,'durationChargeMinor',v_duration,
      'distanceChargeMinor',v_distance_amount,'minimumAdjustmentMinor',v_adjustment),
    'rawAmountMinor',v_raw,'finalEstimatedAmountMinor',v_final);
end; $$;

create function garilink_private.protect_pricing_estimate_snapshot()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.pricing_estimate_snapshot is distinct from old.pricing_estimate_snapshot then
    raise exception 'Rental pricing estimate cannot be changed after submission' using errcode='22023';
  end if;
  return new;
end; $$;
create trigger gl_rentals_pricing_estimate_immutable before update on public.gl_rentals
for each row execute function garilink_private.protect_pricing_estimate_snapshot();

-- Preserve READY media and V2 fields while adding the safe public summary.
create or replace function garilink_private.vehicle_json(v public.gl_vehicles)
returns jsonb language sql stable security definer set search_path='' as $$
  select v.specs || jsonb_build_object(
    'id',v.id,'workspaceId',v.workspace_id,'isVerified',v.is_verified,
    'images',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'position',m.position,'isCover',m.position=0,
      'media',garilink_private.media_json(m)) order by m.position,m.id)
      from public.gl_vehicle_media m where m.vehicle_id=v.id and m.status='READY'),'[]'::jsonb),
    'createdAt',v.created_at,'vehicleCategory',v.vehicle_category,
    'operationalAvailability',v.operational_availability,'capabilities',v.capabilities,
    'rentalPricing',garilink_private.rental_pricing_summary(v));
$$;

create or replace function garilink_private.rental_json(r public.gl_rentals, include_customer boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'id',r.id,'workspaceId',r.workspace_id,'listingId',r.listing_id,'vehicleId',r.vehicle_id,
 'status',r.status,'startDate',r.start_date,'endDate',r.end_date,'dailyRate',r.daily_rate,
 'currency',r.currency,'totalAmount',r.total_amount,'depositAmount',r.deposit_amount,
 'pickupNotes',r.pickup_notes,'rejectionReason',r.rejection_reason,'transportNeed',r.transport_need_snapshot,
 'pickupLocation',r.pickup_location_snapshot,'destinationLocation',r.destination_location_snapshot,
 'pricingEstimate',r.pricing_estimate_snapshot,
 'createdAt',r.created_at,'updatedAt',r.updated_at,
 'listing',jsonb_build_object('id',l.id,'title',l.title,'county',l.county,'vehicle',garilink_private.vehicle_json(v)),
 'customer',case when include_customer then jsonb_build_object('id',r.customer_id,
 'displayName',coalesce(nullif(p.display_name,''),nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'GariLink customer'),
 'phoneNumber',case when u.phone is null or u.phone='' then '' else '+'||ltrim(u.phone,'+') end,'photoUrl',null) else null end)
 from public.gl_listings l join public.gl_vehicles v on v.id=r.vehicle_id
 join public.gl_profiles p on p.user_id=r.customer_id join auth.users u on u.id=r.customer_id where l.id=r.listing_id;
$$;

revoke all on function garilink_private.validate_rental_pricing_policy(jsonb),
  garilink_private.rental_pricing_policy_json(public.gl_vehicle_rental_pricing),
  garilink_private.rental_pricing_summary(public.gl_vehicles),
  garilink_private.evaluate_rental_pricing_v1(jsonb,jsonb),
  garilink_private.protect_pricing_estimate_snapshot() from public,anon,authenticated;
revoke all on function public.garilink_vehicle_rental_pricing(uuid),
  public.garilink_update_vehicle_rental_pricing(uuid,jsonb) from public,anon;
grant execute on function public.garilink_vehicle_rental_pricing(uuid),
  public.garilink_update_vehicle_rental_pricing(uuid,jsonb) to authenticated;

commit;
