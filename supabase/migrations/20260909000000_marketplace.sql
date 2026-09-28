begin;
-- The initial creation contract is deliberately explicit. Private registration,
-- VIN, tracking, documents and verification are not accepted as public specs.
create table public.gl_vehicles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.gl_workspaces(id),
  specs jsonb not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, workspace_id)
);
create table public.gl_listings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  workspace_id uuid not null references public.gl_workspaces(id),
  created_by uuid not null references public.gl_accounts(id),
  request_id uuid not null,
  creation_payload jsonb not null,
  type text not null check (type in ('FOR_SALE','FOR_HIRE')),
  title text not null check (char_length(title) between 1 and 160),
  description text not null check (char_length(description) <= 5000),
  county text not null check (char_length(county) between 1 and 100),
  currency text not null default 'TZS' check (currency = 'TZS'),
  price numeric(12,2) not null check (price > 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','PAUSED','EXPIRED','SOLD','ARCHIVED')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, request_id),
  foreign key (vehicle_id, workspace_id) references public.gl_vehicles(id, workspace_id)
);
create table public.gl_saved_listings (
  user_id uuid not null references public.gl_accounts(id) on delete cascade,
  listing_id uuid not null references public.gl_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index gl_vehicles_workspace on public.gl_vehicles(workspace_id);
create index gl_listings_workspace on public.gl_listings(workspace_id, created_at desc, id);
create index gl_listings_vehicle on public.gl_listings(vehicle_id);
create index gl_listings_public on public.gl_listings(created_at desc, id) where status = 'PUBLISHED';
create index gl_saved_listing on public.gl_saved_listings(listing_id);
alter table public.gl_vehicles enable row level security;
alter table public.gl_listings enable row level security;
alter table public.gl_saved_listings enable row level security;
revoke all on public.gl_vehicles, public.gl_listings, public.gl_saved_listings from public, anon, authenticated;

create function garilink_private.require_capability(actor uuid, capability text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.gl_capabilities c where c.user_id = actor and c.type = capability
    and c.status = 'ACTIVE' and (c.expires_at is null or c.expires_at > now())) then
    raise exception 'Capability required' using errcode = '42501';
  end if;
end;
$$;
create function garilink_private.vehicle_json(v public.gl_vehicles) returns jsonb
language sql stable set search_path = '' as $$
  select v.specs || jsonb_build_object('id',v.id,'workspaceId',v.workspace_id,
    'isVerified',v.is_verified,'images','[]'::jsonb,'createdAt',v.created_at);
$$;
create function garilink_private.listing_json(l public.gl_listings) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',l.id,'vehicleId',l.vehicle_id,'workspaceId',l.workspace_id,
    'type',l.type,'title',l.title,'description',l.description,'county',l.county,'country','TZ',
    'currency',l.currency,'askingPrice',case when l.type = 'FOR_SALE' then l.price end,
    'rentalConfig',case when l.type = 'FOR_HIRE' then jsonb_build_object('dailyRate',l.price) end,
    'status',case when l.status = 'PUBLISHED' and l.expires_at <= now() then 'EXPIRED' else l.status end,
    'isFeatured',false,'publishedAt',l.published_at,'expiresAt',l.expires_at,
    'createdAt',l.created_at,'updatedAt',l.updated_at,
    'saveCount',(select count(*) from public.gl_saved_listings s where s.listing_id = l.id),
    'vehicle',garilink_private.vehicle_json(v),
    'workspace',jsonb_build_object('id',w.id,'name',w.name,'type',w.type,'isVerified',w.is_verified))
  from public.gl_vehicles v join public.gl_workspaces w on w.id = l.workspace_id where v.id = l.vehicle_id;
$$;
create function garilink_private.listing_visible(l public.gl_listings) returns boolean
language sql stable security definer set search_path = '' as $$
  select l.status = 'PUBLISHED' and (l.expires_at is null or l.expires_at > now()) and exists
    (select 1 from public.gl_workspaces w join public.gl_accounts a on a.id = w.owner_id
      join auth.users u on u.id = a.id
      where w.id = l.workspace_id and w.is_active and a.is_active
        and u.phone_confirmed_at is not null and not coalesce(u.is_anonymous,false)
        and (u.banned_until is null or u.banned_until <= now()));
$$;

create function public.garilink_create_draft(input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid; ws uuid; request_key uuid; v jsonb; item record;
  old public.gl_listings; created public.gl_listings; vehicle_key uuid; amount numeric;
begin
  if input is null or jsonb_typeof(input) <> 'object' or jsonb_typeof(input -> 'vehicle') is distinct from 'object' then
    raise exception 'Invalid draft' using errcode = '22023';
  end if;
  for item in select key,value from jsonb_each(input) loop
    if item.key not in ('workspaceId','requestId','type','title','description','county','price','vehicle') or
      (item.key not in ('vehicle','price') and jsonb_typeof(item.value) <> 'string') then
      raise exception 'Invalid listing field' using errcode = '22023';
    end if;
  end loop;
  ws := (input ->> 'workspaceId')::uuid;
  request_key := (input ->> 'requestId')::uuid;
  actor := garilink_private.workspace_access(ws,true);
  perform garilink_private.require_capability(actor,'LIST_VEHICLES');
  perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  if request_key is null or input ->> 'type' is null or input ->> 'type' not in ('FOR_SALE','FOR_HIRE') or
    coalesce(char_length(trim(input ->> 'title')),0) not between 1 and 160 or
    coalesce(char_length(trim(input ->> 'county')),0) not between 1 and 100 or
    char_length(input ->> 'description') > 5000 or jsonb_typeof(input -> 'price') is distinct from 'number' then
    raise exception 'Invalid listing fields' using errcode = '22023';
  end if;
  if input ->> 'type' = 'FOR_HIRE' then perform garilink_private.require_capability(actor,'MANAGE_RENTAL_LISTINGS'); end if;
  amount := (input ->> 'price')::numeric;
  if amount <= 0 or amount >= 10000000000 or amount <> round(amount,2) then
    raise exception 'Invalid price' using errcode = '22023';
  end if;
  v := input -> 'vehicle';
  for item in select key,value from jsonb_each(v) loop
    if item.key not in ('make','model','year','type','fuelType','transmission','condition','mileage') or
      (item.key in ('year','mileage') and jsonb_typeof(item.value) <> 'number') or
      (item.key not in ('year','mileage') and jsonb_typeof(item.value) <> 'string') then
      raise exception 'Invalid vehicle field' using errcode = '22023';
    end if;
  end loop;
  if coalesce(char_length(trim(v ->> 'make')),0) not between 1 and 80 or
    coalesce(char_length(trim(v ->> 'model')),0) not between 1 and 80 or
    coalesce(v ->> 'year','') !~ '^[0-9]{4}$' or
    (v ->> 'year')::int not between 1900 and extract(year from now())::int + 1 or
    coalesce(v ->> 'mileage','') !~ '^[0-9]{1,7}$' or
    coalesce(v ->> 'type','') not in ('CAR','TRUCK','BUS','MOTORCYCLE','TRAILER','OTHER') or
    coalesce(v ->> 'fuelType','') not in ('PETROL','DIESEL','ELECTRIC','HYBRID','LPG','CNG','OTHER') or
    coalesce(v ->> 'transmission','') not in ('AUTOMATIC','MANUAL','CVT','SEMI_AUTO','OTHER') or
    coalesce(v ->> 'condition','') not in ('NEW','FOREIGN_USED','LOCAL_USED','SALVAGE') then
    raise exception 'Invalid vehicle specifications' using errcode = '22023';
  end if;
  -- One transaction creates both records. Concurrent retries serialize per actor.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 1));
  select * into old from public.gl_listings l where l.created_by = actor and l.request_id = request_key;
  if found then
    if old.creation_payload <> input - 'requestId' then raise exception 'Request already used' using errcode = '23505'; end if;
    return garilink_private.listing_json(old);
  end if;
  insert into public.gl_vehicles(workspace_id,specs) values (ws,v) returning id into vehicle_key;
  insert into public.gl_listings(vehicle_id,workspace_id,created_by,request_id,creation_payload,type,title,description,county,price)
    values (vehicle_key,ws,actor,request_key,input - 'requestId',input ->> 'type',trim(input ->> 'title'),
      coalesce(trim(input ->> 'description'),''),trim(input ->> 'county'),amount) returning * into created;
  return garilink_private.listing_json(created);
end;
$$;

create function public.garilink_listing_status(listing_id uuid, action text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.gl_listings; actor uuid; target text;
begin
  select * into l from public.gl_listings where id = listing_id for update;
  if not found then raise exception 'Listing not found' using errcode = 'PT404'; end if;
  actor := garilink_private.workspace_access(l.workspace_id,true);
  perform garilink_private.require_capability(actor,'MANAGE_LISTINGS');
  target := case action when 'publish' then 'PUBLISHED' when 'pause' then 'PAUSED' when 'archive' then 'ARCHIVED' end;
  if target is null then raise exception 'Invalid action' using errcode = '22023'; end if;
  if target = 'PUBLISHED' then
    perform garilink_private.require_capability(actor,'LIST_VEHICLES');
    if l.type = 'FOR_HIRE' then perform garilink_private.require_capability(actor,'MANAGE_RENTAL_LISTINGS'); end if;
  end if;
  if l.status = target and not (target = 'PUBLISHED' and l.expires_at <= now()) then return garilink_private.listing_json(l); end if;
  if l.status = 'ARCHIVED' or (l.status = 'SOLD' and target <> 'ARCHIVED') or
    (target = 'PAUSED' and l.status <> 'PUBLISHED') then
    raise exception 'Listing state changed' using errcode = 'PT409';
  end if;
  update public.gl_listings set status = target, updated_at = now(),
    published_at = case when target = 'PUBLISHED' then now() else published_at end,
    expires_at = case when target = 'PUBLISHED' then now() + interval '30 days' else expires_at end
    where id = listing_id returning * into l;
  return garilink_private.listing_json(l);
end;
$$;
create function public.garilink_search_listings(filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare page_no int := coalesce((filters ->> 'page')::int,1); page_size int := coalesce((filters ->> 'limit')::int,20);
  low_price numeric := (filters ->> 'priceMin')::numeric; high_price numeric := (filters ->> 'priceMax')::numeric;
  result jsonb; total bigint;
begin
  if filters is null or jsonb_typeof(filters) <> 'object' or page_no not between 1 and 10000 or page_size not between 1 and 100 or
    char_length(filters ->> 'q') > 100 or char_length(filters ->> 'county') > 100 or
    low_price < 0 or high_price < 0 or low_price > high_price or
    (filters ? 'type' and filters ->> 'type' not in ('FOR_SALE','FOR_HIRE')) then
    raise exception 'Invalid search filters' using errcode = '22023';
  end if;
  with matches as (
    select l.* from public.gl_listings l where garilink_private.listing_visible(l)
      and (nullif(filters ->> 'type','') is null or l.type = filters ->> 'type')
      and (nullif(trim(filters ->> 'county'),'') is null or position(lower(trim(filters ->> 'county')) in lower(l.county)) > 0)
      and (nullif(trim(filters ->> 'q'),'') is null or position(lower(trim(filters ->> 'q')) in lower(l.title || ' ' || l.description)) > 0)
      and (low_price is null or l.price >= low_price) and (high_price is null or l.price <= high_price)
  ), paged as (select * from matches order by created_at desc,id limit page_size offset (page_no - 1) * page_size)
  select (select count(*) from matches), coalesce(jsonb_agg(garilink_private.listing_json(p) order by p.created_at desc,p.id),'[]'::jsonb)
    into total,result from paged p;
  return jsonb_build_object('data',result,'total',total,'page',page_no,'limit',page_size);
end;
$$;
create function public.garilink_listing(listing_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare l public.gl_listings;
begin
  select * into l from public.gl_listings where id = listing_id;
  if not found or not garilink_private.listing_visible(l) then raise exception 'Listing not found' using errcode = 'PT404'; end if;
  return garilink_private.listing_json(l);
end;
$$;
create function public.garilink_my_listings() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); result jsonb;
begin
  select coalesce(jsonb_agg(garilink_private.listing_json(l) order by l.created_at desc,l.id),'[]'::jsonb) into result
    from public.gl_listings l join public.gl_workspaces w on w.id = l.workspace_id where w.is_active and
    (w.owner_id = actor or exists (select 1 from public.gl_workspace_members m where m.workspace_id = w.id
      and m.user_id = actor and m.status = 'ACTIVE'));
  return jsonb_build_object('data',result);
end;
$$;
create function public.garilink_vehicle(vehicle_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v public.gl_vehicles;
begin
  select * into v from public.gl_vehicles where id = vehicle_id;
  if not found then raise exception 'Vehicle not found' using errcode = 'PT404'; end if;
  perform garilink_private.workspace_access(v.workspace_id);
  return garilink_private.vehicle_json(v);
end;
$$;
create function public.garilink_workspace_vehicles(workspace_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform garilink_private.workspace_access(workspace_id);
  return jsonb_build_object('data',(select coalesce(jsonb_agg(garilink_private.vehicle_json(v) order by v.created_at desc,v.id),'[]'::jsonb)
    from public.gl_vehicles v where v.workspace_id = garilink_workspace_vehicles.workspace_id));
end;
$$;
create function public.garilink_save_listing(listing_id uuid, saved boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); l public.gl_listings;
begin
  if saved is null then raise exception 'Saved state required' using errcode = '22023'; end if;
  -- Serialize with publication changes; desired-state writes are safe to retry.
  select * into l from public.gl_listings where id = listing_id for update;
  if saved then
    if not found or not garilink_private.listing_visible(l) then raise exception 'Listing not found' using errcode = 'PT404'; end if;
    insert into public.gl_saved_listings(user_id,listing_id) values (actor,l.id) on conflict do nothing;
  else
    delete from public.gl_saved_listings s where s.user_id = actor and s.listing_id = garilink_save_listing.listing_id;
  end if;
  return jsonb_build_object('saved',saved);
end;
$$;
create function public.garilink_saved_listings() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); result jsonb;
begin
  select coalesce(jsonb_agg(garilink_private.listing_json(l) order by s.created_at desc,l.id),'[]'::jsonb) into result
    from public.gl_saved_listings s join public.gl_listings l on l.id = s.listing_id
    where s.user_id = actor and garilink_private.listing_visible(l);
  return jsonb_build_object('data',result);
end;
$$;
revoke all on all functions in schema garilink_private from public, anon, authenticated;
revoke all on function public.garilink_create_draft(jsonb), public.garilink_listing_status(uuid,text),
  public.garilink_my_listings(), public.garilink_vehicle(uuid), public.garilink_workspace_vehicles(uuid),
  public.garilink_save_listing(uuid,boolean), public.garilink_saved_listings() from public, anon;
grant execute on function public.garilink_create_draft(jsonb), public.garilink_listing_status(uuid,text),
  public.garilink_my_listings(), public.garilink_vehicle(uuid), public.garilink_workspace_vehicles(uuid),
  public.garilink_save_listing(uuid,boolean), public.garilink_saved_listings() to authenticated;
revoke all on function public.garilink_search_listings(jsonb), public.garilink_listing(uuid) from public;
grant execute on function public.garilink_search_listings(jsonb), public.garilink_listing(uuid) to anon, authenticated;
commit;
