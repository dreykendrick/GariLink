begin;

-- Idempotent repair for hosted projects where the media table/RPC migration was
-- applied but the Storage policy portion was absent or stale. Authorization
-- remains tied to the exact server-reserved object row and authenticated actor.
create or replace function garilink_private.can_upload_media(object_name text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.gl_vehicle_media m
    where m.storage_path = object_name
      and m.status = 'PENDING'
      and m.created_by = auth.uid()
  );
$$;

create or replace function garilink_private.can_delete_media(object_name text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.gl_vehicle_media m
    join public.gl_workspaces w on w.id = m.workspace_id
    where m.storage_path = object_name
      and (
        w.owner_id = auth.uid()
        or exists (
          select 1 from public.gl_workspace_members wm
          where wm.workspace_id = w.id
            and wm.user_id = auth.uid()
            and wm.status = 'ACTIVE'
            and wm.role in ('OWNER', 'MANAGER')
        )
      )
  );
$$;

revoke all on function garilink_private.can_upload_media(text),
  garilink_private.can_delete_media(text) from public, anon;
grant usage on schema garilink_private to authenticated;
grant execute on function garilink_private.can_upload_media(text),
  garilink_private.can_delete_media(text) to authenticated;

drop policy if exists garilink_vehicle_media_insert on storage.objects;
drop policy if exists garilink_vehicle_media_upload_returning on storage.objects;
drop policy if exists garilink_vehicle_media_update on storage.objects;
drop policy if exists garilink_vehicle_media_delete on storage.objects;

create policy garilink_vehicle_media_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vehicle-media'
  and garilink_private.can_upload_media(name)
);

-- Storage's standard upload uses INSERT ... RETURNING. Permit only the same
-- authenticated actor's still-pending reservation to be returned. READY media
-- remains unreadable through this policy and is served only by signed URLs.
create policy garilink_vehicle_media_upload_returning
on storage.objects for select to authenticated
using (
  bucket_id = 'vehicle-media'
  and garilink_private.can_upload_media(name)
);

create policy garilink_vehicle_media_update
on storage.objects for update to authenticated
using (
  bucket_id = 'vehicle-media'
  and garilink_private.can_upload_media(name)
)
with check (
  bucket_id = 'vehicle-media'
  and garilink_private.can_upload_media(name)
);

create policy garilink_vehicle_media_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'vehicle-media'
  and garilink_private.can_delete_media(name)
);

commit;
