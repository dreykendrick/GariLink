begin;

create function public.garilink_update_listing(listing_id uuid, patch jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.gl_listings; actor uuid; item record; v jsonb; amount numeric;
begin
  if patch is null or jsonb_typeof(patch) <> 'object' or patch = '{}'::jsonb then
    raise exception 'Provide listing changes' using errcode = '22023';
  end if;
  for item in select key,value from jsonb_each(patch) loop
    if item.key not in ('type','title','description','county','price','vehicle') then
      raise exception 'Invalid listing field' using errcode = '22023';
    end if;
  end loop;
  select * into l from public.gl_listings where id = listing_id for update;
  if not found then raise exception 'Listing not found' using errcode = 'PT404'; end if;
  actor := garilink_private.workspace_access(l.workspace_id,true);
  perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  if l.status in ('ARCHIVED','SOLD') then raise exception 'Listing cannot be edited' using errcode = 'PT409'; end if;
  if patch ? 'type' and (jsonb_typeof(patch->'type') <> 'string' or patch->>'type' not in ('FOR_SALE','FOR_HIRE')) then
    raise exception 'Invalid listing type' using errcode = '22023';
  end if;
  if coalesce(patch->>'type',l.type) = 'FOR_HIRE' then
    perform garilink_private.require_capability(actor,'MANAGE_RENTAL_LISTINGS');
  end if;
  if patch ? 'title' and (jsonb_typeof(patch->'title') <> 'string' or char_length(trim(patch->>'title')) not between 1 and 160) then
    raise exception 'Invalid title' using errcode = '22023';
  end if;
  if patch ? 'description' and (jsonb_typeof(patch->'description') <> 'string' or char_length(patch->>'description') > 5000) then
    raise exception 'Invalid description' using errcode = '22023';
  end if;
  if patch ? 'county' and (jsonb_typeof(patch->'county') <> 'string' or char_length(trim(patch->>'county')) not between 1 and 100) then
    raise exception 'Invalid location' using errcode = '22023';
  end if;
  if patch ? 'price' then
    if jsonb_typeof(patch->'price') <> 'number' then raise exception 'Invalid price' using errcode = '22023'; end if;
    amount := (patch->>'price')::numeric;
    if amount <= 0 or amount >= 10000000000 or amount <> round(amount,2) then raise exception 'Invalid price' using errcode = '22023'; end if;
  end if;
  if patch ? 'vehicle' then
    v := patch->'vehicle';
    if jsonb_typeof(v) <> 'object' then raise exception 'Invalid vehicle' using errcode = '22023'; end if;
    for item in select key,value from jsonb_each(v) loop
      if item.key not in ('make','model','year','type','fuelType','transmission','condition','mileage') then
        raise exception 'Invalid vehicle field' using errcode = '22023';
      end if;
    end loop;
    v := (select specs || v from public.gl_vehicles where id=l.vehicle_id);
    if coalesce(char_length(trim(v->>'make')),0) not between 1 and 80 or coalesce(char_length(trim(v->>'model')),0) not between 1 and 80 or
      coalesce(v->>'year','') !~ '^[0-9]{4}$' or (v->>'year')::int not between 1900 and extract(year from now())::int + 1 or
      coalesce(v->>'mileage','') !~ '^[0-9]{1,7}$' or v->>'type' not in ('CAR','TRUCK','BUS','MOTORCYCLE','TRAILER','OTHER') or
      v->>'fuelType' not in ('PETROL','DIESEL','ELECTRIC','HYBRID','LPG','CNG','OTHER') or
      v->>'transmission' not in ('AUTOMATIC','MANUAL','CVT','SEMI_AUTO','OTHER') or v->>'condition' not in ('NEW','FOREIGN_USED','LOCAL_USED','SALVAGE') then
      raise exception 'Invalid vehicle specifications' using errcode = '22023';
    end if;
    update public.gl_vehicles set specs=v where id=l.vehicle_id;
  end if;
  update public.gl_listings set
    type=coalesce(patch->>'type',type), title=case when patch ? 'title' then trim(patch->>'title') else title end,
    description=case when patch ? 'description' then trim(patch->>'description') else description end,
    county=case when patch ? 'county' then trim(patch->>'county') else county end,
    price=case when patch ? 'price' then amount else price end, updated_at=now()
    where id=listing_id returning * into l;
  return garilink_private.listing_json(l);
end;
$$;

revoke all on function public.garilink_update_listing(uuid,jsonb) from public, anon;
grant execute on function public.garilink_update_listing(uuid,jsonb) to authenticated;
commit;
