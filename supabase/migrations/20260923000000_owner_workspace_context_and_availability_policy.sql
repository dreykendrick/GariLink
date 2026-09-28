begin;

-- Extend the existing authoritative workspace contract without changing its
-- authorization boundary or removing fields consumed by older clients.
create or replace function garilink_private.workspace_json(w public.gl_workspaces)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', w.id, 'name', w.name, 'type', w.type,
    'businessMode', w.business_mode,
    'ownerId', w.owner_id, 'description', w.description, 'country', w.country,
    'isActive', w.is_active, 'isVerified', w.is_verified, 'logoUrl', null,
    'createdAt', w.created_at, 'updatedAt', w.updated_at
  );
$$;
revoke all on function garilink_private.workspace_json(public.gl_workspaces)
  from public, anon, authenticated;

-- Manual availability expresses owner intent and is never rewritten by rental
-- transitions. Eligibility adds the independent committed-rental guard.
create index if not exists gl_rentals_vehicle_committed
  on public.gl_rentals (vehicle_id, status)
  where status in ('APPROVED','READY_FOR_PICKUP','ACTIVE');

create or replace function garilink_private.v2_discovery_eligibility(v public.gl_vehicles)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'discoverable', exists(select 1 from public.gl_listings l
      join public.gl_workspaces w on w.id=l.workspace_id
      join public.gl_accounts a on a.id=w.owner_id
      join auth.users u on u.id=a.id
      where l.vehicle_id=v.id and l.type='FOR_HIRE' and l.status='PUBLISHED'
        and w.is_active and a.is_active and u.phone_confirmed_at is not null
        and v.vehicle_category is not null and v.capabilities is not null),
    'requestable', exists(select 1 from public.gl_listings l
      join public.gl_workspaces w on w.id=l.workspace_id
      join public.gl_accounts a on a.id=w.owner_id
      join auth.users u on u.id=a.id
      where l.vehicle_id=v.id and l.type='FOR_HIRE' and l.status='PUBLISHED'
        and w.is_active and a.is_active and u.phone_confirmed_at is not null
        and v.vehicle_category is not null and v.capabilities is not null
        and v.operational_availability='AVAILABLE'
        and not exists (
          select 1 from public.gl_rentals r
          where r.vehicle_id=v.id
            and r.status in ('APPROVED','READY_FOR_PICKUP','ACTIVE')
        )),
    'operationalAvailability', v.operational_availability,
    'blockedByCommittedRental', exists (
      select 1 from public.gl_rentals r
      where r.vehicle_id=v.id
        and r.status in ('APPROVED','READY_FOR_PICKUP','ACTIVE')
    )
  );
$$;
revoke all on function garilink_private.v2_discovery_eligibility(public.gl_vehicles)
  from public, anon, authenticated;

commit;
