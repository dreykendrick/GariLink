begin;
create table public.gl_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.gl_accounts(id),
  name text not null check (char_length(trim(name)) between 1 and 100),
  type text not null check (type in ('PERSONAL','DEALERSHIP','RENTAL_COMPANY','FLEET_OWNER','GARAGE','LOGISTICS','SPARE_PARTS','INSURANCE')),
  description text check (char_length(description) <= 1000),
  country text not null default 'TZ',
  is_active boolean not null default true,
  is_verified boolean not null default false,
  request_id uuid not null,
  creation_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, request_id)
);
create table public.gl_workspace_members (
  workspace_id uuid not null references public.gl_workspaces(id) on delete cascade,
  user_id uuid not null references public.gl_accounts(id),
  role text not null check (role in ('OWNER','MANAGER','MEMBER','VIEWER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','LEFT')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index gl_workspace_members_user_id on public.gl_workspace_members(user_id);
alter table public.gl_workspaces enable row level security;
alter table public.gl_workspace_members enable row level security;
revoke all on public.gl_workspaces, public.gl_workspace_members from public, anon, authenticated;

create function garilink_private.workspace_access(workspace_id uuid, write_access boolean default false) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user();
begin
  if not exists (select 1 from public.gl_workspaces w where w.id = workspace_id and w.is_active
    and (w.owner_id = actor or exists (select 1 from public.gl_workspace_members m
      where m.workspace_id = w.id and m.user_id = actor and m.status = 'ACTIVE'
      and (not write_access or m.role in ('OWNER','MANAGER'))))) then
    raise exception 'Workspace access denied' using errcode = '42501';
  end if;
  return actor;
end;
$$;
revoke all on function garilink_private.workspace_access(uuid,boolean) from public, anon, authenticated;

create function garilink_private.workspace_json(w public.gl_workspaces) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('id', w.id, 'name', w.name, 'type', w.type,
    'ownerId', w.owner_id, 'description', w.description, 'country', w.country,
    'isActive', w.is_active, 'isVerified', w.is_verified, 'logoUrl', null,
    'createdAt', w.created_at, 'updatedAt', w.updated_at);
$$;
revoke all on function garilink_private.workspace_json(public.gl_workspaces) from public, anon, authenticated;

create function public.garilink_workspaces() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); result jsonb;
begin
  select coalesce(jsonb_agg(garilink_private.workspace_json(w) order by w.created_at, w.id), '[]'::jsonb)
  into result from public.gl_workspaces w where w.is_active and
    (w.owner_id = actor or exists (select 1 from public.gl_workspace_members m
      where m.workspace_id = w.id and m.user_id = actor and m.status = 'ACTIVE'));
  return result;
end;
$$;
create function public.garilink_workspace(workspace_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform garilink_private.workspace_access(workspace_id);
  return (select garilink_private.workspace_json(w) from public.gl_workspaces w where w.id = workspace_id);
end;
$$;

create function public.garilink_create_workspace(input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := garilink_private.require_user(); item record;
  existing public.gl_workspaces; created public.gl_workspaces; request_key uuid;
begin
  if input is null or jsonb_typeof(input) <> 'object' then
    raise exception 'Invalid workspace' using errcode = '22023';
  end if;
  for item in select key, value from jsonb_each(input) loop
    if item.key not in ('name','type','description','requestId') or jsonb_typeof(item.value) <> 'string' then
      raise exception 'Invalid workspace field' using errcode = '22023';
    end if;
  end loop;
  if coalesce(char_length(trim(input ->> 'name')),0) not between 1 and 100 or
     char_length(input ->> 'description') > 1000 or
     input ->> 'type' is null or input ->> 'type' not in
       ('PERSONAL','DEALERSHIP','RENTAL_COMPANY','FLEET_OWNER','GARAGE','LOGISTICS','SPARE_PARTS','INSURANCE') or
     input ->> 'requestId' is null then
    raise exception 'Invalid workspace fields' using errcode = '22023';
  end if;
  request_key := (input ->> 'requestId')::uuid;
  -- Serialize creates per owner so a retry is idempotent even during races.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  select * into existing from public.gl_workspaces w where w.owner_id = actor and w.request_id = request_key;
  if found then
    if existing.creation_payload <> input - 'requestId' then
      raise exception 'Request ID already used with different details' using errcode = '23505';
    end if;
    return garilink_private.workspace_json(existing);
  end if;
  insert into public.gl_workspaces(owner_id, name, type, description, request_id, creation_payload)
    values (actor, trim(input ->> 'name'), input ->> 'type', nullif(trim(input ->> 'description'), ''), request_key, input - 'requestId')
    returning * into created;
  insert into public.gl_workspace_members(workspace_id, user_id, role) values (created.id, actor, 'OWNER');
  insert into public.gl_user_roles(user_id, role) values (actor, 'PRIVATE_OWNER') on conflict do nothing;
  insert into public.gl_capabilities(user_id, type, status) values
    (actor,'LIST_VEHICLES','ACTIVE'),(actor,'MANAGE_LISTINGS','ACTIVE'),
    (actor,'MANAGE_RENTAL_LISTINGS','ACTIVE'),(actor,'MANAGE_FLEET','ACTIVE') on conflict do nothing;
  -- Existing suspended/revoked capabilities are deliberately never reactivated.
  return garilink_private.workspace_json(created);
end;
$$;

create function public.garilink_update_workspace(workspace_id uuid, patch jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare item record;
begin
  perform garilink_private.workspace_access(workspace_id, true);
  if patch is null or jsonb_typeof(patch) <> 'object' then raise exception 'Invalid patch' using errcode = '22023'; end if;
  for item in select key, value from jsonb_each(patch) loop
    if item.key not in ('name','description') or jsonb_typeof(item.value) <> 'string' then
      raise exception 'Invalid workspace field' using errcode = '22023';
    end if;
  end loop;
  if (patch ? 'name' and char_length(trim(patch ->> 'name')) not between 1 and 100) or
     char_length(patch ->> 'description') > 1000 then
    raise exception 'Invalid workspace field length' using errcode = '22023';
  end if;
  update public.gl_workspaces w set
    name = case when patch ? 'name' then trim(patch ->> 'name') else w.name end,
    description = case when patch ? 'description' then nullif(trim(patch ->> 'description'), '') else w.description end,
    updated_at = now() where w.id = workspace_id;
  return public.garilink_workspace(workspace_id);
end;
$$;
revoke all on function public.garilink_workspaces(), public.garilink_workspace(uuid),
  public.garilink_create_workspace(jsonb), public.garilink_update_workspace(uuid,jsonb) from public, anon;
grant execute on function public.garilink_workspaces(), public.garilink_workspace(uuid),
  public.garilink_create_workspace(jsonb), public.garilink_update_workspace(uuid,jsonb) to authenticated;
commit;
