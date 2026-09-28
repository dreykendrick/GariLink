begin;

create extension if not exists btree_gist with schema extensions;

create table public.gl_rentals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.gl_listings(id),
  vehicle_id uuid not null references public.gl_vehicles(id),
  workspace_id uuid not null references public.gl_workspaces(id),
  customer_id uuid not null references public.gl_accounts(id),
  request_id uuid not null,
  request_payload jsonb not null,
  status text not null default 'REQUESTED' check (status in
    ('REQUESTED','UNDER_REVIEW','APPROVED','REJECTED','CANCELLED','READY_FOR_PICKUP','ACTIVE','COMPLETED')),
  start_date date not null,
  end_date date not null,
  daily_rate numeric(12,2) not null check (daily_rate > 0),
  currency text not null check (currency = 'TZS'),
  total_amount numeric(14,2) not null check (total_amount > 0),
  deposit_amount numeric(14,2),
  pickup_notes text check (char_length(pickup_notes) <= 1000),
  rejection_reason text check (char_length(rejection_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, request_id),
  check (end_date > start_date),
  foreign key (vehicle_id, workspace_id) references public.gl_vehicles(id, workspace_id)
);

-- Requests may overlap while an owner evaluates them. Only one request can enter
-- a confirmed/active state for a vehicle and date range, even under concurrency.
alter table public.gl_rentals add constraint gl_rentals_no_confirmed_overlap
  exclude using gist (
    vehicle_id with =,
    daterange(start_date, end_date, '[)') with &&
  ) where (status in ('APPROVED','READY_FOR_PICKUP','ACTIVE'));

create index gl_rentals_customer on public.gl_rentals(customer_id, created_at desc);
create index gl_rentals_workspace on public.gl_rentals(workspace_id, created_at desc);
alter table public.gl_rentals enable row level security;
revoke all on public.gl_rentals from public, anon, authenticated;

create function garilink_private.rental_json(r public.gl_rentals, include_customer boolean default false)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id',r.id,'workspaceId',r.workspace_id,'listingId',r.listing_id,'vehicleId',r.vehicle_id,
    'status',r.status,'startDate',r.start_date,'endDate',r.end_date,'dailyRate',r.daily_rate,
    'currency',r.currency,'totalAmount',r.total_amount,'depositAmount',r.deposit_amount,
    'pickupNotes',r.pickup_notes,'rejectionReason',r.rejection_reason,
    'createdAt',r.created_at,'updatedAt',r.updated_at,
    'listing',jsonb_build_object('id',l.id,'title',l.title,'county',l.county,
      'vehicle',garilink_private.vehicle_json(v)),
    'customer',case when include_customer then jsonb_build_object(
      'id',r.customer_id,
      'displayName',coalesce(nullif(p.display_name,''),nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'GariLink customer'),
      'phoneNumber',case when u.phone is null or u.phone = '' then '' else '+' || ltrim(u.phone,'+') end,
      'photoUrl',null) else null end)
  from public.gl_listings l
  join public.gl_vehicles v on v.id = r.vehicle_id
  join public.gl_profiles p on p.user_id = r.customer_id
  join auth.users u on u.id = r.customer_id
  where l.id = r.listing_id;
$$;

create function public.garilink_create_rental(input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); item record; l public.gl_listings;
  old public.gl_rentals; created public.gl_rentals; request_key uuid; starts date; ends date;
  notes text; canonical jsonb;
begin
  if input is null or jsonb_typeof(input) <> 'object' then raise exception 'Invalid rental request' using errcode = '22023'; end if;
  for item in select key,value from jsonb_each(input) loop
    if item.key not in ('listingId','requestId','startDate','endDate','pickupNotes') or jsonb_typeof(item.value) <> 'string' then
      raise exception 'Invalid rental field' using errcode = '22023';
    end if;
  end loop;
  begin
    request_key := (input ->> 'requestId')::uuid;
    starts := (input ->> 'startDate')::timestamptz::date;
    ends := (input ->> 'endDate')::timestamptz::date;
  exception when others then raise exception 'Invalid rental dates or request ID' using errcode = '22023'; end;
  notes := nullif(trim(input ->> 'pickupNotes'),'');
  if starts <= current_date or ends <= starts or ends > starts + 366 or char_length(notes) > 1000 then
    raise exception 'Invalid rental dates or notes' using errcode = '22023';
  end if;
  select * into l from public.gl_listings where id = (input ->> 'listingId')::uuid for share;
  if not found or l.type <> 'FOR_HIRE' or not garilink_private.listing_visible(l) then
    raise exception 'Listing not found' using errcode = 'PT404';
  end if;
  if exists (select 1 from public.gl_workspaces w where w.id = l.workspace_id and
    (w.owner_id = actor or exists (select 1 from public.gl_workspace_members m where m.workspace_id = w.id
      and m.user_id = actor and m.status = 'ACTIVE'))) then
    raise exception 'You cannot rent your own vehicle' using errcode = '42501';
  end if;
  canonical := jsonb_build_object('listingId',l.id,'startDate',starts,'endDate',ends,'pickupNotes',notes);
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 2));
  select * into old from public.gl_rentals where customer_id = actor and request_id = request_key;
  if found then
    if old.request_payload <> canonical then raise exception 'Request ID already used' using errcode = '23505'; end if;
    return garilink_private.rental_json(old);
  end if;
  insert into public.gl_rentals(listing_id,vehicle_id,workspace_id,customer_id,request_id,request_payload,
    start_date,end_date,daily_rate,currency,total_amount,pickup_notes)
  values (l.id,l.vehicle_id,l.workspace_id,actor,request_key,canonical,starts,ends,l.price,l.currency,
    l.price * (ends - starts),notes) returning * into created;
  return garilink_private.rental_json(created);
end;
$$;

create function public.garilink_my_rentals() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); result jsonb;
begin
  select coalesce(jsonb_agg(garilink_private.rental_json(r) order by r.created_at desc,r.id),'[]'::jsonb)
    into result from public.gl_rentals r where r.customer_id = actor;
  return result;
end;
$$;

create function public.garilink_cancel_rental(rental_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); r public.gl_rentals;
begin
  select * into r from public.gl_rentals where id = rental_id for update;
  if not found then raise exception 'Rental not found' using errcode = 'PT404'; end if;
  if r.customer_id <> actor then raise exception 'Rental access denied' using errcode = '42501'; end if;
  if r.status = 'CANCELLED' then return garilink_private.rental_json(r); end if;
  if r.status not in ('REQUESTED','UNDER_REVIEW','APPROVED') then raise exception 'Rental state changed' using errcode = 'PT409'; end if;
  update public.gl_rentals set status = 'CANCELLED',updated_at = now() where id = r.id returning * into r;
  return garilink_private.rental_json(r);
end;
$$;

create function public.garilink_workspace_rentals(workspace_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform garilink_private.workspace_access(workspace_id);
  select coalesce(jsonb_agg(garilink_private.rental_json(r,true) order by r.created_at desc,r.id),'[]'::jsonb)
    into result from public.gl_rentals r where r.workspace_id = garilink_workspace_rentals.workspace_id;
  return result;
end;
$$;

create function public.garilink_rental_action(workspace_id uuid, rental_id uuid, action text, reason text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid; r public.gl_rentals; target text;
begin
  actor := garilink_private.workspace_access(workspace_id,true);
  perform garilink_private.require_capability(actor,'MANAGE_RENTAL_LISTINGS');
  select x.* into r from public.gl_rentals x where x.id = rental_id and x.workspace_id = garilink_rental_action.workspace_id for update;
  if not found then raise exception 'Rental not found' using errcode = 'PT404'; end if;
  if r.customer_id = actor then raise exception 'Owners cannot manage their own rental' using errcode = '42501'; end if;
  target := case action when 'approve' then 'APPROVED' when 'reject' then 'REJECTED'
    when 'ready' then 'READY_FOR_PICKUP' when 'start' then 'ACTIVE' when 'complete' then 'COMPLETED' end;
  if target is null or (action = 'reject' and coalesce(char_length(trim(reason)),0) not between 1 and 500) then
    raise exception 'Invalid rental action' using errcode = '22023';
  end if;
  if r.status = target then return garilink_private.rental_json(r,true); end if;
  if not ((action in ('approve','reject') and r.status in ('REQUESTED','UNDER_REVIEW')) or
    (action = 'ready' and r.status = 'APPROVED') or (action = 'start' and r.status = 'READY_FOR_PICKUP') or
    (action = 'complete' and r.status = 'ACTIVE')) then
    raise exception 'Rental state changed' using errcode = 'PT409';
  end if;
  begin
    update public.gl_rentals set status = target,
      rejection_reason = case when target = 'REJECTED' then trim(reason) else rejection_reason end,
      updated_at = now() where id = r.id returning * into r;
  exception when exclusion_violation then
    raise exception 'Vehicle is unavailable for these dates' using errcode = 'PT409';
  end;
  return garilink_private.rental_json(r,true);
end;
$$;

revoke all on function garilink_private.rental_json(public.gl_rentals,boolean) from public,anon,authenticated;
revoke all on function public.garilink_create_rental(jsonb),public.garilink_my_rentals(),
  public.garilink_cancel_rental(uuid),public.garilink_workspace_rentals(uuid),
  public.garilink_rental_action(uuid,uuid,text,text) from public,anon;
grant execute on function public.garilink_create_rental(jsonb),public.garilink_my_rentals(),
  public.garilink_cancel_rental(uuid),public.garilink_workspace_rentals(uuid),
  public.garilink_rental_action(uuid,uuid,text,text) to authenticated;

commit;
