begin;

-- Repair hosted finalization failures caused by PL/pgSQL parameter/column name
-- collisions (width, height and byte_size), and tolerate the MIME metadata key
-- variants emitted by supported Supabase Storage releases.
create or replace function public.garilink_finalize_vehicle_media(
  media_id uuid,
  byte_size integer,
  width integer,
  height integer
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  m public.gl_vehicle_media;
  object_metadata jsonb;
  object_size bigint;
  object_mime text;
begin
  select * into m
  from public.gl_vehicle_media
  where id=$1
  for update;

  if not found then
    raise exception 'Media not found' using errcode='PT404';
  end if;

  perform garilink_private.workspace_access(m.workspace_id,true);

  select o.metadata into object_metadata
  from storage.objects o
  where o.bucket_id='vehicle-media' and o.name=m.storage_path;

  if object_metadata is null then
    raise exception 'Upload is incomplete' using errcode='PT409';
  end if;

  object_size:=nullif(object_metadata->>'size','')::bigint;
  object_mime:=lower(coalesce(
    object_metadata->>'mimetype',
    object_metadata->>'contentType',
    object_metadata->>'content-type',
    ''
  ));

  if object_mime='image/jpg' then object_mime:='image/jpeg'; end if;

  if object_size is null then
    raise exception 'Upload is incomplete' using errcode='PT409';
  end if;

  if $2 is null or object_size<>$2 or $2 not between 1 and 6291456 or
    $3 not between 1 and 10000 or $4 not between 1 and 10000 or
    object_mime<>m.mime_type then
    raise exception 'Invalid uploaded image' using errcode='22023';
  end if;

  update public.gl_vehicle_media target
  set status='READY',byte_size=object_size,width=$3,height=$4,updated_at=now()
  where target.id=m.id
  returning * into m;

  return garilink_private.media_json(m);
end;
$$;

commit;
