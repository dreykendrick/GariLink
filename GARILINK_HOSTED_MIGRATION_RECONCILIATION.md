# GariLink Hosted Migration Reconciliation

## Evidence captured 2026-09-13

Project: `yvcdkmsfuakjflmuatgz`.

The hosted migration ledger records only the four baseline migrations through
`20260909000000_marketplace`. The actual hosted schema contains multiple
post-baseline objects. This is migration-history drift; it must not be repaired
by marking timestamps applied solely from a filename.

| Migration | Remote ledger before | Actual hosted evidence | Classification | Safe action |
|---|---:|---|---|---|
| 20260912000000 rentals | missing | `gl_rentals`; `garilink_rental_action(uuid,uuid,text,text)` present | PARTIALLY_PRESENT pending full audit | Do not repair yet |
| 20260912010000 vehicle media | missing | `gl_vehicle_media`, reserve/finalize RPCs present | PARTIALLY_PRESENT pending trigger/grant audit | Do not repair yet |
| 20260912020000 marketplace showcase | missing | `garilink_search_listings(jsonb)` present | PARTIALLY_PRESENT pending function-body audit | Do not repair yet |
| 20260912030000 seller management | missing | `garilink_update_listing(uuid,jsonb)` present | PARTIALLY_PRESENT pending function-body/grant audit | Do not repair yet |
| 20260913000000 storage policy repair | missing | upload policy helper exists; only 3 `garilink_vehicle_media_*` policies exist where the migration creates 4 | PARTIALLY_PRESENT | Create/validate an additive reconciliation migration; do not repair ledger |
| 20260913001000 finalize repair | missing | finalization RPC exists, body/version not yet attested | PARTIALLY_PRESENT | Compare `pg_get_functiondef` before any repair |
| 20260914000000 V2 foundation | missing | V2 columns and `garilink_v2_update_vehicle` absent | NOT_PRESENT | Must be legitimately applied after reconciliation |
| 20260914010000 V2 owner activation | missing | Depends on absent V2 foundation | NOT_PRESENT | Must be legitimately applied after foundation |

## Trusted boundary

`20260909000000_marketplace` is the last ledger-confirmed common migration.
It is not yet sufficient proof that every post-baseline migration is fully
present, so no `supabase migration repair --status applied` action is justified
at this stage.

## Supported CLI evidence

`supabase migration list` was run from `supabase/` (the directory containing
`config.toml` and `.temp/project-ref`) and targeted
`yvcdkmsfuakjflmuatgz`. It reports the four baseline timestamps remotely and
every migration from `20260912000000` through `20260914010000` locally only.

`supabase db pull` correctly refused to generate a diagnostic migration because
the remote ledger conflicts with the local migration directory. Its suggested
bulk repair includes the V2 timestamps; that suggestion is intentionally not
safe to follow because the V2 columns and RPCs are absent.

An attempted `supabase db dump --linked --schema public` cannot run in this
workstation because the installed CLI requires Docker Desktop for the dump
container. This also blocks the required clean local `supabase db reset` chain
simulation. No remote database state was changed by either failed diagnostic.

## Required next evidence

1. Link the repository to the project with a non-secret local Supabase CLI
   session, then run `supabase migration list` and `supabase db pull` as a
   diagnostic only.
2. Compare function definitions, triggers, grants, indexes and RLS policies for
   each row marked PARTIALLY_PRESENT.
3. Add forward-only reconciliation migrations for only the missing effects.
4. Only then repair timestamps proven FULLY_PRESENT_UNRECORDED.
5. Apply V2 migrations normally; never mark them applied without SQL execution.
