-- Native Supabase identity foundation. Intentionally separate from the legacy
-- Prisma tables: no account is linked by an unverified phone number or metadata.
-- Existing data requires an explicit, reviewed ID mapping before cutover.
begin;

create schema if not exists garilink_private;
revoke all on schema garilink_private from public, anon, authenticated;

create table public.gl_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.gl_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.gl_accounts(id) on delete cascade,
  first_name text check (char_length(first_name) <= 80),
  last_name text check (char_length(last_name) <= 80),
  display_name text check (char_length(display_name) <= 80),
  city text check (char_length(city) <= 100),
  bio text check (char_length(bio) <= 500),
  country text not null default 'TZ',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.gl_user_roles (
  user_id uuid not null references public.gl_accounts(id) on delete cascade,
  role text not null check (role in ('CUSTOMER', 'PRIVATE_OWNER', 'DEALER', 'MECHANIC', 'INSPECTOR', 'ADMIN')),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
create table public.gl_capabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.gl_accounts(id) on delete cascade,
  type text not null check (type in ('LIST_VEHICLES', 'MANAGE_LISTINGS', 'MANAGE_RENTAL_LISTINGS', 'MANAGE_FLEET', 'PERFORM_INSPECTIONS', 'PERFORM_REPAIRS', 'ADMIN')),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'REJECTED')),
  expires_at timestamptz,
  unique (user_id, type)
);

alter table public.gl_accounts enable row level security;
alter table public.gl_profiles enable row level security;
alter table public.gl_user_roles enable row level security;
alter table public.gl_capabilities enable row level security;
revoke all on public.gl_accounts, public.gl_profiles, public.gl_user_roles, public.gl_capabilities from public, anon, authenticated;

-- All writes go through narrow RPCs. No client can grant roles, activate a
-- capability, reactivate an account, or change phone verification flags.
create function garilink_private.bootstrap_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.gl_accounts(id) values (new.id);
  insert into public.gl_profiles(user_id, first_name, last_name)
  values (new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'firstName'), 80), ''),
    nullif(left(trim(new.raw_user_meta_data ->> 'lastName'), 80), ''));
  insert into public.gl_user_roles(user_id, role) values (new.id, 'CUSTOMER');
  return new;
end;
$$;
revoke all on function garilink_private.bootstrap_user() from public, anon, authenticated;
create trigger garilink_auth_user_created after insert on auth.users
for each row execute function garilink_private.bootstrap_user();

create function garilink_private.require_user(require_verified boolean default true) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid;
begin
  if not exists (select 1 from auth.sessions s where s.user_id = auth.uid()
    and s.id::text = auth.jwt() ->> 'session_id') then
    raise sqlstate 'PT401' using message = 'Your session has expired. Please sign in again.';
  end if;
  select u.id into actor from auth.users u
  join public.gl_accounts a on a.id = u.id
  where u.id = auth.uid() and a.is_active
    and not coalesce(u.is_anonymous, false)
    and (u.banned_until is null or u.banned_until <= now())
    and (not require_verified or u.phone_confirmed_at is not null);
  if actor is null then
    raise exception 'Sign in with an active, verified account to continue.' using errcode = '42501';
  end if;
  return actor;
end;
$$;
revoke all on function garilink_private.require_user(boolean) from public, anon, authenticated;

create function public.garilink_me() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(false); result jsonb;
begin
  select jsonb_build_object(
    'id', u.id, 'phoneNumber', case when u.phone = '' then '' else '+' || ltrim(u.phone, '+') end,
    'email', nullif(u.email, ''), 'isPhoneVerified', u.phone_confirmed_at is not null,
    'isEmailVerified', u.email_confirmed_at is not null,
    'roles', coalesce((select jsonb_agg(r.role order by r.role) from public.gl_user_roles r where r.user_id = actor), '[]'::jsonb),
    'capabilities', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'type', c.type, 'status', c.status))
      from public.gl_capabilities c where c.user_id = actor and (c.expires_at is null or c.expires_at > now())), '[]'::jsonb),
    'profile', jsonb_build_object('id', p.id, 'userId', actor, 'firstName', p.first_name,
      'lastName', p.last_name, 'displayName', p.display_name, 'city', p.city, 'bio', p.bio,
      'country', p.country, 'completionPercentage',
      (case when p.first_name is not null then 25 else 0 end +
       case when p.last_name is not null then 25 else 0 end +
       case when p.city is not null then 25 else 0 end +
       case when u.phone_confirmed_at is not null then 25 else 0 end)))
  into result from auth.users u join public.gl_profiles p on p.user_id = u.id where u.id = actor;
  return result;
end;
$$;
revoke all on function public.garilink_me() from public, anon;
grant execute on function public.garilink_me() to authenticated;

create function public.garilink_update_profile(patch jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); entry record;
begin
  if patch is null or jsonb_typeof(patch) <> 'object' then
    raise exception 'Profile must be an object.' using errcode = '22023';
  end if;
  for entry in select key, value from jsonb_each(patch) loop
    if entry.key not in ('firstName', 'lastName', 'displayName', 'city', 'bio') or
       jsonb_typeof(entry.value) not in ('string', 'null') then
      raise exception 'Invalid profile field.' using errcode = '22023';
    end if;
    if char_length(patch ->> entry.key) > (case entry.key when 'bio' then 500 when 'city' then 100 else 80 end) then
      raise exception 'Profile field is too long.' using errcode = '22023';
    end if;
  end loop;
  update public.gl_profiles set
    first_name = case when patch ? 'firstName' then nullif(trim(patch ->> 'firstName'), '') else first_name end,
    last_name = case when patch ? 'lastName' then nullif(trim(patch ->> 'lastName'), '') else last_name end,
    display_name = case when patch ? 'displayName' then nullif(trim(patch ->> 'displayName'), '') else display_name end,
    city = case when patch ? 'city' then nullif(trim(patch ->> 'city'), '') else city end,
    bio = case when patch ? 'bio' then nullif(trim(patch ->> 'bio'), '') else bio end,
    updated_at = now()
  where user_id = actor;
  return public.garilink_me() -> 'profile';
end;
$$;
revoke all on function public.garilink_update_profile(jsonb) from public, anon;
grant execute on function public.garilink_update_profile(jsonb) to authenticated;

commit;
