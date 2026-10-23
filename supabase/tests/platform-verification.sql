-- Disposable Supabase CI only. No Auth stand-in, migrations, or real documents.
\set ON_ERROR_STOP on
begin;
create function pg_temp.assert_true(value boolean, description text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'Assertion failed: %',description; end if; end $$;
select 'BEGIN REAL PLATFORM CLOSED VERIFICATION SQL' as certification_stage;
\ir verification-closed-assertions.sql
select 'PASS REAL PLATFORM CLOSED VERIFICATION SQL' as certification_stage;
rollback;
