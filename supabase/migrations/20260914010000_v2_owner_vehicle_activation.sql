begin;

-- V2 owner supply activation. This is additive: legacy listing operations keep
-- their existing behaviour while V2 rental publication uses this readiness gate.
create or replace function garilink_private.vehicle_json(v public.gl_vehicles) returns jsonb
language sql stable set search_path = '' as $$
  select v.specs || jsonb_build_object(
    'id',v.id,'workspaceId',v.workspace_id,'isVerified',v.is_verified,
    'images','[]'::jsonb,'createdAt',v.created_at,
    'vehicleCategory',v.vehicle_category,
    'operationalAvailability',v.operational_availability,
    'capabilities',v.capabilities
  );
$$;

create function garilink_private.v2_publication_readiness(v public.gl_vehicles)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare reason text;
begin
  if v.vehicle_category is null then reason := 'Add a vehicle category before publishing.';
  elsif v.capabilities is null then reason := 'Add vehicle capabilities before publishing.';
  else
    begin
      perform garilink_private.validate_vehicle_capabilities(v.vehicle_category, v.capabilities);
    exception when others then reason := 'Review the vehicle capabilities before publishing.';
    end;
  end if;
  if reason is null and not exists (
    select 1 from public.gl_vehicle_media m where m.vehicle_id=v.id and m.status='READY'
  ) then reason := 'Add at least one ready vehicle photo before publishing.'; end if;
  return jsonb_build_object('ready', reason is null, 'reason', reason);
end;
$$;

create function public.garilink_v2_create_vehicle_draft(input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; ws uuid; request_key uuid; vehicle_input jsonb; caps jsonb;
  category text; availability text; v public.gl_vehicles; l public.gl_listings;
  amount numeric; item record;
begin
  if input is null or jsonb_typeof(input) <> 'object' then
    raise exception 'Invalid vehicle draft' using errcode='22023';
  end if;
  for item in select key,value from jsonb_each(input) loop
    if item.key not in ('workspaceId','requestId','title','description','county','price','vehicle','vehicleCategory','capabilities','operationalAvailability') then
      raise exception 'Invalid vehicle draft field' using errcode='22023';
    end if;
  end loop;
  ws := (input->>'workspaceId')::uuid; request_key := (input->>'requestId')::uuid;
  actor := garilink_private.workspace_access(ws,true);
  perform garilink_private.require_capability(actor,'LIST_VEHICLES');
  perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  perform garilink_private.require_capability(actor,'MANAGE_RENTAL_LISTINGS');
  if request_key is null or coalesce(char_length(trim(input->>'title')),0) not between 1 and 160
    or coalesce(char_length(trim(input->>'county')),0) not between 1 and 100
    or char_length(coalesce(input->>'description','')) > 5000
    or jsonb_typeof(input->'price') <> 'number' then
    raise exception 'Complete the required rental vehicle details.' using errcode='22023';
  end if;
  amount := (input->>'price')::numeric;
  if amount <= 0 or amount >= 10000000000 or amount <> round(amount,2) then raise exception 'Enter a valid daily rate.' using errcode='22023'; end if;
  vehicle_input := input->'vehicle';
  if jsonb_typeof(vehicle_input) <> 'object' then raise exception 'Complete the vehicle identity.' using errcode='22023'; end if;
  -- Reuse proven legacy specification validation by allowing only its canonical shape.
  for item in select key,value from jsonb_each(vehicle_input) loop
    if item.key not in ('make','model','year','type','fuelType','transmission','condition','mileage') then raise exception 'Invalid vehicle identity field' using errcode='22023'; end if;
  end loop;
  if coalesce(char_length(trim(vehicle_input->>'make')),0) not between 1 and 80 or coalesce(char_length(trim(vehicle_input->>'model')),0) not between 1 and 80
    or coalesce(vehicle_input->>'year','') !~ '^[0-9]{4}$' or (vehicle_input->>'year')::int not between 1900 and extract(year from now())::int + 1
    or coalesce(vehicle_input->>'mileage','') !~ '^[0-9]{1,7}$' or coalesce(vehicle_input->>'type','') not in ('CAR','TRUCK','BUS','MOTORCYCLE','TRAILER','OTHER')
    or coalesce(vehicle_input->>'fuelType','') not in ('PETROL','DIESEL','ELECTRIC','HYBRID','LPG','CNG','OTHER')
    or coalesce(vehicle_input->>'transmission','') not in ('AUTOMATIC','MANUAL','CVT','SEMI_AUTO','OTHER')
    or coalesce(vehicle_input->>'condition','') not in ('NEW','FOREIGN_USED','LOCAL_USED','SALVAGE') then raise exception 'Invalid vehicle identity.' using errcode='22023'; end if;
  category := input->>'vehicleCategory'; availability := coalesce(input->>'operationalAvailability','UNAVAILABLE');
  caps := garilink_private.validate_vehicle_capabilities(category,input->'capabilities');
  if availability not in ('AVAILABLE','BUSY','UNAVAILABLE','MAINTENANCE') then raise exception 'Invalid availability.' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 3));
  select l0.* into l from public.gl_listings l0 where l0.created_by=actor and l0.request_id=request_key;
  if found then
    if l.creation_payload <> input-'requestId' then raise exception 'Request already used' using errcode='23505'; end if;
    select * into v from public.gl_vehicles where id=l.vehicle_id;
    return garilink_private.listing_json(l) || jsonb_build_object('eligibility',garilink_private.v2_discovery_eligibility(v));
  end if;
  insert into public.gl_vehicles(workspace_id,specs,vehicle_category,capabilities,operational_availability)
    values(ws,vehicle_input,category,caps,availability) returning * into v;
  insert into public.gl_listings(vehicle_id,workspace_id,created_by,request_id,creation_payload,type,title,description,county,price)
    values(v.id,ws,actor,request_key,input-'requestId','FOR_HIRE',trim(input->>'title'),coalesce(trim(input->>'description'),''),trim(input->>'county'),amount)
    returning * into l;
  return garilink_private.listing_json(l) || jsonb_build_object('eligibility',garilink_private.v2_discovery_eligibility(v));
end;
$$;

create function public.garilink_v2_set_publication(target_vehicle_id uuid, action text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v public.gl_vehicles; l public.gl_listings; actor uuid; readiness jsonb; target text;
begin
  select * into v from public.gl_vehicles where id=target_vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  actor := garilink_private.workspace_access(v.workspace_id,true);
  perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  select * into l from public.gl_listings where vehicle_id=v.id and type='FOR_HIRE' order by created_at desc limit 1 for update;
  if not found then raise exception 'Rental publication not found' using errcode='PT404'; end if;
  target := case action when 'publish' then 'PUBLISHED' when 'pause' then 'PAUSED' when 'archive' then 'ARCHIVED' end;
  if target is null then raise exception 'Invalid publication action' using errcode='22023'; end if;
  if target='PUBLISHED' then
    perform garilink_private.require_capability(actor,'LIST_VEHICLES'); perform garilink_private.require_capability(actor,'MANAGE_RENTAL_LISTINGS');
    readiness := garilink_private.v2_publication_readiness(v);
    if not (readiness->>'ready')::boolean then raise exception '%',readiness->>'reason' using errcode='22023'; end if;
  end if;
  if l.status='ARCHIVED' and target<>'ARCHIVED' then raise exception 'Publication has been archived.' using errcode='PT409'; end if;
  if target='PAUSED' and l.status<>'PUBLISHED' then raise exception 'Only a published vehicle can be paused.' using errcode='PT409'; end if;
  update public.gl_listings set status=target,updated_at=now(),published_at=case when target='PUBLISHED' then now() else published_at end,
    expires_at=case when target='PUBLISHED' then now()+interval '30 days' else expires_at end where id=l.id returning * into l;
  return garilink_private.listing_json(l) || jsonb_build_object('publicationReadiness',readiness,'eligibility',garilink_private.v2_discovery_eligibility(v));
end;
$$;

revoke all on function garilink_private.v2_publication_readiness(public.gl_vehicles) from public,anon,authenticated;
revoke all on function public.garilink_v2_create_vehicle_draft(jsonb), public.garilink_v2_set_publication(uuid,text) from public,anon;
grant execute on function public.garilink_v2_create_vehicle_draft(jsonb), public.garilink_v2_set_publication(uuid,text) to authenticated;

commit;
