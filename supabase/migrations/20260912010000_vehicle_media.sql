begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('vehicle-media','vehicle-media',false,6291456,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=6291456,
  allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create table public.gl_vehicle_media (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.gl_vehicles(id) on delete cascade,
  workspace_id uuid not null references public.gl_workspaces(id),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer check (byte_size between 1 and 6291456),
  width integer check (width between 1 and 10000),
  height integer check (height between 1 and 10000),
  position smallint not null check (position between 0 and 9),
  status text not null default 'PENDING' check (status in ('PENDING','READY')),
  created_by uuid not null references public.gl_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gl_vehicle_media_position_unique unique(vehicle_id,position) deferrable initially immediate,
  foreign key(vehicle_id,workspace_id) references public.gl_vehicles(id,workspace_id),
  check (storage_path = workspace_id::text || '/' || vehicle_id::text || '/' || id::text ||
    case mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end)
);
create index gl_vehicle_media_pending on public.gl_vehicle_media(created_at) where status='PENDING';
alter table public.gl_vehicle_media enable row level security;
revoke all on public.gl_vehicle_media from public,anon,authenticated;

create function garilink_private.media_json(m public.gl_vehicle_media) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object('id',m.id,'vehicleId',m.vehicle_id,'workspaceId',m.workspace_id,
    'storagePath',m.storage_path,'mimeType',m.mime_type,'byteSize',m.byte_size,
    'width',m.width,'height',m.height,'position',m.position,'isCover',m.position=0,
    'createdAt',m.created_at);
$$;

create or replace function garilink_private.vehicle_json(v public.gl_vehicles) returns jsonb
language sql stable security definer set search_path='' as $$
  select v.specs || jsonb_build_object('id',v.id,'workspaceId',v.workspace_id,
    'isVerified',v.is_verified,'images',coalesce((select jsonb_agg(
      jsonb_build_object('id',m.id,'position',m.position,'isCover',m.position=0,
        'media',garilink_private.media_json(m)) order by m.position,m.id)
      from public.gl_vehicle_media m where m.vehicle_id=v.id and m.status='READY'),'[]'::jsonb),
    'createdAt',v.created_at);
$$;

create function public.garilink_reserve_vehicle_media(vehicle_id uuid,mime_type text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; v public.gl_vehicles; m public.gl_vehicle_media; ext text; next_position int; media_key uuid:=gen_random_uuid();
begin
  select * into v from public.gl_vehicles where id=vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  actor:=garilink_private.workspace_access(v.workspace_id,true);
  perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  if mime_type not in ('image/jpeg','image/png','image/webp') then raise exception 'Unsupported image type' using errcode='22023'; end if;
  delete from public.gl_vehicle_media x where x.vehicle_id=v.id and x.status='PENDING' and x.created_at < now()-interval '2 hours';
  select coalesce(max(position),-1)+1 into next_position from public.gl_vehicle_media where gl_vehicle_media.vehicle_id=v.id;
  if next_position>9 then raise exception 'A vehicle can have up to 10 photos' using errcode='PT409'; end if;
  ext:=case mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end;
  insert into public.gl_vehicle_media(id,vehicle_id,workspace_id,storage_path,mime_type,position,created_by)
    values(media_key,v.id,v.workspace_id,v.workspace_id::text||'/'||v.id::text||'/'||media_key::text||ext,
      mime_type,next_position,actor) returning * into m;
  return garilink_private.media_json(m);
end;
$$;

create function public.garilink_finalize_vehicle_media(media_id uuid,byte_size integer,width integer,height integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.gl_vehicle_media; object_size bigint; object_mime text;
begin
  select * into m from public.gl_vehicle_media where id=media_id for update;
  if not found then raise exception 'Media not found' using errcode='PT404'; end if;
  perform garilink_private.workspace_access(m.workspace_id,true);
  select (metadata->>'size')::bigint,metadata->>'mimetype' into object_size,object_mime
    from storage.objects where bucket_id='vehicle-media' and name=m.storage_path;
  if object_size is null then raise exception 'Upload is incomplete' using errcode='PT409'; end if;
  if byte_size is null or object_size<>byte_size or byte_size not between 1 and 6291456 or
    width not between 1 and 10000 or height not between 1 and 10000 or object_mime<>m.mime_type then
    raise exception 'Invalid uploaded image' using errcode='22023';
  end if;
  update public.gl_vehicle_media set status='READY',byte_size=object_size,width=width,height=height,updated_at=now()
    where id=m.id returning * into m;
  return garilink_private.media_json(m);
end;
$$;

create function public.garilink_reorder_vehicle_media(vehicle_id uuid,media_ids uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v public.gl_vehicles; count_ready int; result jsonb;
begin
  select * into v from public.gl_vehicles where id=vehicle_id for update;
  if not found then raise exception 'Vehicle not found' using errcode='PT404'; end if;
  perform garilink_private.workspace_access(v.workspace_id,true);
  perform garilink_private.require_capability(garilink_private.require_user(),'MANAGE_LISTINGS');
  select count(*) into count_ready from public.gl_vehicle_media where gl_vehicle_media.vehicle_id=v.id and status='READY';
  if media_ids is null or cardinality(media_ids)<>count_ready or cardinality(media_ids)<>cardinality(array(select distinct x from unnest(media_ids) x)) or
    exists(select 1 from public.gl_vehicle_media p where p.vehicle_id=v.id and p.status='PENDING') or
    exists(select 1 from unnest(media_ids) x left join public.gl_vehicle_media m on m.id=x and m.vehicle_id=v.id and m.status='READY' where m.id is null) then
    raise exception 'Provide every photo exactly once' using errcode='22023';
  end if;
  set constraints gl_vehicle_media_position_unique deferred;
  update public.gl_vehicle_media m set position=o.ord-1,updated_at=now()
    from unnest(media_ids) with ordinality o(id,ord) where m.id=o.id;
  select coalesce(jsonb_agg(garilink_private.media_json(m) order by m.position),'[]'::jsonb) into result
    from public.gl_vehicle_media m where m.vehicle_id=v.id and m.status='READY';
  return result;
end;
$$;

create function public.garilink_vehicle_media_delete(media_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.gl_vehicle_media; removed_position int;
begin
  select * into m from public.gl_vehicle_media where id=media_id for update;
  if not found then raise exception 'Media not found' using errcode='PT404'; end if;
  perform garilink_private.workspace_access(m.workspace_id,true);
  perform garilink_private.require_capability(garilink_private.require_user(),'MANAGE_LISTINGS');
  removed_position:=m.position;
  set constraints gl_vehicle_media_position_unique deferred;
  delete from public.gl_vehicle_media where id=m.id;
  update public.gl_vehicle_media set position=position-1,updated_at=now()
    where vehicle_id=m.vehicle_id and position>removed_position;
  return jsonb_build_object('id',m.id,'storagePath',m.storage_path,'deleted',true);
end;
$$;

create function public.garilink_vehicle_media_delete_ticket(media_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare m public.gl_vehicle_media;
begin
  select * into m from public.gl_vehicle_media where id=media_id;
  if not found then raise exception 'Media not found' using errcode='PT404'; end if;
  perform garilink_private.workspace_access(m.workspace_id,true);
  perform garilink_private.require_capability(garilink_private.require_user(),'MANAGE_LISTINGS');
  return jsonb_build_object('id',m.id,'storagePath',m.storage_path);
end;
$$;

create function garilink_private.require_listing_media() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status='PUBLISHED' and not exists(select 1 from public.gl_vehicle_media m
    where m.vehicle_id=new.vehicle_id and m.status='READY') then
    raise exception 'Add at least one vehicle photo before publishing' using errcode='PT409';
  end if;
  return new;
end;
$$;
create trigger gl_listing_media_before_publish before insert or update of status on public.gl_listings
for each row execute function garilink_private.require_listing_media();

create function garilink_private.can_upload_media(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.gl_vehicle_media m where m.storage_path=object_name
    and m.status='PENDING' and m.created_by=auth.uid());
$$;
create function garilink_private.can_delete_media(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.gl_vehicle_media m join public.gl_workspaces w on w.id=m.workspace_id
    where m.storage_path=object_name and (w.owner_id=auth.uid() or exists(select 1
      from public.gl_workspace_members wm where wm.workspace_id=w.id and wm.user_id=auth.uid()
      and wm.status='ACTIVE' and wm.role in ('OWNER','MANAGER'))));
$$;

-- Uploads require a server-reserved row and exact owner/workspace/vehicle path.
create policy garilink_vehicle_media_insert on storage.objects for insert to authenticated
with check(bucket_id='vehicle-media' and garilink_private.can_upload_media(name));
create policy garilink_vehicle_media_update on storage.objects for update to authenticated
using(bucket_id='vehicle-media' and garilink_private.can_upload_media(name))
with check(bucket_id='vehicle-media' and garilink_private.can_upload_media(name));
create policy garilink_vehicle_media_delete on storage.objects for delete to authenticated
using(bucket_id='vehicle-media' and garilink_private.can_delete_media(name));
-- Reads and deletes go through the authenticated facade, which signs or removes
-- exact RPC-authorized paths. The private bucket never exposes raw public URLs.

revoke all on all functions in schema garilink_private from public,anon,authenticated;
grant usage on schema garilink_private to authenticated;
grant execute on function garilink_private.can_upload_media(text),garilink_private.can_delete_media(text) to authenticated;
revoke all on function public.garilink_reserve_vehicle_media(uuid,text),
  public.garilink_finalize_vehicle_media(uuid,integer,integer,integer),
  public.garilink_reorder_vehicle_media(uuid,uuid[]),public.garilink_vehicle_media_delete(uuid),
  public.garilink_vehicle_media_delete_ticket(uuid)
  from public,anon;
grant execute on function public.garilink_reserve_vehicle_media(uuid,text),
  public.garilink_finalize_vehicle_media(uuid,integer,integer,integer),
  public.garilink_reorder_vehicle_media(uuid,uuid[]),public.garilink_vehicle_media_delete(uuid),
  public.garilink_vehicle_media_delete_ticket(uuid)
  to authenticated;

commit;
