begin;

-- V2 owner activation added category/capability fields but accidentally
-- restored the pre-media serializer's hard-coded empty image list. Preserve
-- all V2 fields while projecting only READY media through the established
-- safe media serializer. Edge code replaces storagePath with a short-lived
-- signed publicUrl before returning API responses.
create or replace function garilink_private.vehicle_json(v public.gl_vehicles)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select v.specs || jsonb_build_object(
    'id',v.id,
    'workspaceId',v.workspace_id,
    'isVerified',v.is_verified,
    'images',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',m.id,
          'position',m.position,
          'isCover',m.position=0,
          'media',garilink_private.media_json(m)
        ) order by m.position,m.id
      )
      from public.gl_vehicle_media m
      where m.vehicle_id=v.id and m.status='READY'
    ),'[]'::jsonb),
    'createdAt',v.created_at,
    'vehicleCategory',v.vehicle_category,
    'operationalAvailability',v.operational_availability,
    'capabilities',v.capabilities
  );
$$;

revoke all on function garilink_private.vehicle_json(public.gl_vehicles)
  from public,anon,authenticated;

commit;
