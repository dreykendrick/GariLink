begin;

-- Retain deployed argument names for PostgREST while explicitly qualifying
-- parameters everywhere a table exposes the same column name.
create or replace function public.garilink_v2_update_vehicle(vehicle_id uuid, patch jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; v public.gl_vehicles; item record; category text; availability text; capability_value jsonb;
begin
  select * into v from public.gl_vehicles where id=garilink_v2_update_vehicle.vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  actor:=garilink_private.workspace_access(v.workspace_id,true); perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  if patch is null or jsonb_typeof(patch) <> 'object' then raise exception 'Invalid vehicle patch' using errcode='22023'; end if;
  for item in select key,value from jsonb_each(patch) loop if item.key not in ('vehicleCategory','operationalAvailability','capabilities') then raise exception 'Unsupported vehicle field' using errcode='22023'; end if; end loop;
  category:=coalesce(patch->>'vehicleCategory',v.vehicle_category); availability:=coalesce(patch->>'operationalAvailability',v.operational_availability); capability_value:=case when patch ? 'capabilities' then patch->'capabilities' else v.capabilities end;
  if category is null or availability not in ('AVAILABLE','BUSY','UNAVAILABLE','MAINTENANCE') then raise exception 'Invalid vehicle state' using errcode='22023'; end if;
  capability_value:=garilink_private.validate_vehicle_capabilities(category,capability_value);
  update public.gl_vehicles set vehicle_category=category,capabilities=capability_value,operational_availability=availability,availability_updated_at=case when availability<>v.operational_availability then now() else availability_updated_at end where id=v.id returning * into v;
  return garilink_private.vehicle_json(v)||jsonb_build_object('vehicleCategory',v.vehicle_category,'operationalAvailability',v.operational_availability,'capabilities',v.capabilities,'eligibility',garilink_private.v2_discovery_eligibility(v));
end; $$;

create or replace function public.garilink_v2_vehicle_eligibility(vehicle_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.gl_vehicles;
begin select * into v from public.gl_vehicles where id=garilink_v2_vehicle_eligibility.vehicle_id; if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if; perform garilink_private.workspace_access(v.workspace_id); return garilink_private.v2_discovery_eligibility(v); end; $$;

create or replace function public.garilink_v2_set_publication(vehicle_id uuid, action text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v public.gl_vehicles; l public.gl_listings; actor uuid; readiness jsonb; target text;
begin
  select * into v from public.gl_vehicles where id=garilink_v2_set_publication.vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  actor:=garilink_private.workspace_access(v.workspace_id,true); perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  select * into l from public.gl_listings where gl_listings.vehicle_id=v.id and type='FOR_HIRE' order by created_at desc limit 1 for update;
  if not found then raise exception 'Rental publication not found' using errcode='PT404'; end if;
  target:=case action when 'publish' then 'PUBLISHED' when 'pause' then 'PAUSED' when 'archive' then 'ARCHIVED' end; if target is null then raise exception 'Invalid publication action' using errcode='22023'; end if;
  if target='PUBLISHED' then perform garilink_private.require_capability(actor,'LIST_VEHICLES'); perform garilink_private.require_capability(actor,'MANAGE_RENTAL_LISTINGS'); readiness:=garilink_private.v2_publication_readiness(v); if not (readiness->>'ready')::boolean then raise exception '%',readiness->>'reason' using errcode='22023'; end if; end if;
  if l.status='ARCHIVED' and target<>'ARCHIVED' then raise exception 'Publication has been archived.' using errcode='PT409'; end if; if target='PAUSED' and l.status<>'PUBLISHED' then raise exception 'Only a published vehicle can be paused.' using errcode='PT409'; end if;
  update public.gl_listings set status=target,updated_at=now(),published_at=case when target='PUBLISHED' then now() else published_at end,expires_at=case when target='PUBLISHED' then now()+interval '30 days' else expires_at end where id=l.id returning * into l;
  return garilink_private.listing_json(l)||jsonb_build_object('publicationReadiness',readiness,'eligibility',garilink_private.v2_discovery_eligibility(v));
end; $$;
commit;
