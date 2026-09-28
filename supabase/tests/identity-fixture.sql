-- Minimal Auth schema stand-in for PostgreSQL logic tests, NOT a Supabase Auth
-- emulator. The runner wraps this and the migrations/tests in one rollback.
do $$ begin
  if current_database() <> 'garilink_dev' then raise exception 'Wrong test database'; end if;
  if exists (select 1 from pg_namespace where nspname in ('auth', 'garilink_private')) or
     exists (select 1 from pg_roles where rolname in ('anon', 'authenticated', 'service_role')) then
    raise exception 'Refusing to alter pre-existing Supabase schemas or roles';
  end if;
end $$;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create schema storage;
create table auth.users (
  id uuid primary key, phone text, email text, phone_confirmed_at timestamptz,
  email_confirmed_at timestamptz, is_anonymous boolean default false,
  banned_until timestamptz, raw_user_meta_data jsonb
);
create table auth.sessions (id uuid primary key, user_id uuid references auth.users);
create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb);
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to authenticated;
create function auth.jwt() returns jsonb language sql stable as
  $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
create function auth.uid() returns uuid language sql stable as
  $$ select (auth.jwt() ->> 'sub')::uuid $$;
create function pg_temp.assert_true(value boolean, description text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'Assertion failed: %', description; end if; end $$;
