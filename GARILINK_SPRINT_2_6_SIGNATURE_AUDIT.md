# Sprint 2.6 — Complete function signature audit

## Scope and strategy

All 32 canonical migrations parsed with PostgreSQL's real grammar through pglast 7.10 (installed as local user-space audit tooling, not an application dependency). 103 CREATE/CREATE OR REPLACE declarations cover 74 identities and 29 replacement events. 94 top-level grant/trigger/policy dependency statements are captured. No explicit DROP FUNCTION, ALTER FUNCTION or overload chains were found. The JSON registry records migration, identity, parameter order/types/modes/default ASTs, return/setof, chronology and source references. Parser source locations are removed from default comparisons to avoid false mismatches. Public RPCs and private helpers are both covered.

Dollar-quoted bodies/comments are parsed as PostgreSQL syntax, not regex declarations. PL/pgSQL body execution is not certified by this parser. The email migration's dynamic pg_get_functiondef transformations are not new static declarations; their runtime guards and preservation of argument/return/grant metadata still require CI SQL execution. Consumer references are text locations for review, not proof that every textual occurrence is an executed call.

## Confirmed mismatches and coherent correction

| RPC | Initial name before | Intended final/API name | Corrected migration |
| --- | --- | --- | --- |
| garilink_v2_update_vehicle(uuid,jsonb) | target_vehicle_id | vehicle_id | 20260914000000_v2_vehicle_foundation.sql |
| garilink_v2_vehicle_eligibility(uuid) | target_vehicle_id | vehicle_id | 20260914000000_v2_vehicle_foundation.sql |
| garilink_v2_set_publication(uuid,text) | target_vehicle_id | vehicle_id | 20260914010000_v2_owner_vehicle_activation.sql |

All three replacements occur in 20260914040000. Foundation/activation initial declarations now use vehicle_id and their reads use function-qualified references. No later RPC contract changed. Existing positional calls continue unchanged. Edge handler lines 715–728 supplies vehicle_id for all three, and existing API contract tests pass. The location update intentionally retains target_vehicle_id because its Edge call uses that name; location/pricing reads retain p_vehicle_id. This avoids broad renaming.

The previously committed validator correction remains intact. No further argument-name/type/order/mode/default/return mismatches were found after these three fixes. Different input types would form new identities; the overload regression also rejects unreviewed same-name identities. Comparison is conservative about defaults, not an assertion that all default changes are prohibited by PostgreSQL.

No DROP/recreate, authorization/grant/RLS change, error-code change or new migration was introduced. Only existing parameter identifiers and qualified references changed. This is approved clean-chain history repair, not an upgrade for already-applied hosted schemas. Hosted states require separately reviewed forward compatibility; never replay the edited history onto them.

## Files proposed for reviewed commit

- supabase/migrations/20260914000000_v2_vehicle_foundation.sql
- supabase/migrations/20260914010000_v2_owner_vehicle_activation.sql
- supabase/tests/audit-function-signatures.py
- supabase/tests/function-signature-registry.json
- supabase/tests/migration-signature.test.mjs
- .github/workflows/database-certification.yml (install pinned parser before Node signature tests)
- GARILINK_SPRINT_2_6_SIGNATURE_AUDIT.md

No Flutter behavior changed. Unrelated generated backend/dist, verification preview work, prior reports and evidence logs are preserved and excluded. No files are staged/committed/pushed in this pass.

## Regression and verification

Signature regression now uses fresh PostgreSQL AST output, not a regex or the checked-in snapshot: all chains compatible, reviewed named V2 contracts, and absence of accidental overload/drop chains. Requires Python plus `python -m pip install pglast==7.10`; CI's disposable Linux job installs that exact audit dependency before npm test. Set GARILINK_SQL_PYTHON only to an approved local interpreter if python is not on PATH.

- Focused signature tests: 3 passed, 0 failed, exit 0.
- Full Supabase Node suite: 106 passed, 0 failed, 0 skipped, exit 0.
- All 32 migration outer statements parsed without syntax errors; AST compatibility errors: 0.
- SQL composition succeeded: 3,232 lines; no database connection.
- Workflow YAML parse and read-only permissions check: PASS.
- Targeted Git diff check: clean; targeted secret scan recorded separately below.

SQL/RLS NOT CERTIFIED. Third remote run has not occurred. AST checks do not prove runtime PL/pgSQL, grants, tenant isolation, publication/rentals or Auth/Storage lifecycle correctness. Further non-signature errors may surface. No workflow redesign or remote operation occurred.

## Chronological registry

Complete machine-readable modes, types, default expressions, returns, dependency ASTs and source references: supabase/tests/function-signature-registry.json. Compact all-identity inventory follows.

| Function identity | Introduction | Replacement migrations | Final input names | Return | Consumers |
| --- | --- | --- | --- | --- | --- |
| `garilink_private.bootstrap_user()` | 20260908000000_identity.sql | — |  | trigger | 3 references (JSON) |
| `garilink_private.require_user(pg_catalog.bool)` | 20260908000000_identity.sql | 20261009000000_email_first_preparation_access.sql | require_verified | uuid | 29 references (JSON) |
| `public.garilink_me()` | 20260908000000_identity.sql | — |  | jsonb | 22 references (JSON) |
| `public.garilink_update_profile(jsonb)` | 20260908000000_identity.sql | — | patch | jsonb | 10 references (JSON) |
| `public.garilink_claim_sms(text)` | 20260908001000_sms_delivery.sql | — | message_id | text | 8 references (JSON) |
| `public.garilink_accept_sms(text)` | 20260908001000_sms_delivery.sql | — | message_id | void | 5 references (JSON) |
| `garilink_private.workspace_access(uuid,pg_catalog.bool)` | 20260908002000_workspaces.sql | — | workspace_id, write_access | uuid | 29 references (JSON) |
| `garilink_private.workspace_json(public.gl_workspaces)` | 20260908002000_workspaces.sql | 20260923000000_owner_workspace_context_and_availability_policy.sql | w | jsonb | 8 references (JSON) |
| `public.garilink_workspaces()` | 20260908002000_workspaces.sql | — |  | jsonb | 8 references (JSON) |
| `public.garilink_workspace(uuid)` | 20260908002000_workspaces.sql | — | workspace_id | jsonb | 37 references (JSON) |
| `public.garilink_create_workspace(jsonb)` | 20260908002000_workspaces.sql | — | input | jsonb | 11 references (JSON) |
| `public.garilink_update_workspace(uuid,jsonb)` | 20260908002000_workspaces.sql | — | workspace_id, patch | jsonb | 8 references (JSON) |
| `garilink_private.require_capability(uuid,text)` | 20260909000000_marketplace.sql | — | actor, capability | void | 25 references (JSON) |
| `garilink_private.vehicle_json(public.gl_vehicles)` | 20260909000000_marketplace.sql | 20260912010000_vehicle_media.sql, 20260914010000_v2_owner_vehicle_activation.sql, 20260922010000_v2_vehicle_media_serialization.sql, 20260922020000_rental_pricing_v1.sql | v | jsonb | 18 references (JSON) |
| `garilink_private.listing_json(public.gl_listings)` | 20260909000000_marketplace.sql | — | l | jsonb | 19 references (JSON) |
| `garilink_private.listing_visible(public.gl_listings)` | 20260909000000_marketplace.sql | — | l | pg_catalog.bool | 14 references (JSON) |
| `public.garilink_create_draft(jsonb)` | 20260909000000_marketplace.sql | — | input | jsonb | 13 references (JSON) |
| `public.garilink_listing_status(uuid,text)` | 20260909000000_marketplace.sql | — | listing_id, action | jsonb | 13 references (JSON) |
| `public.garilink_search_listings(jsonb)` | 20260909000000_marketplace.sql | 20260912020000_marketplace_showcase.sql | filters | jsonb | 22 references (JSON) |
| `public.garilink_listing(uuid)` | 20260909000000_marketplace.sql | — | listing_id | jsonb | 19 references (JSON) |
| `public.garilink_my_listings()` | 20260909000000_marketplace.sql | — |  | jsonb | 11 references (JSON) |
| `public.garilink_vehicle(uuid)` | 20260909000000_marketplace.sql | — | vehicle_id | jsonb | 37 references (JSON) |
| `public.garilink_workspace_vehicles(uuid)` | 20260909000000_marketplace.sql | — | workspace_id | jsonb | 10 references (JSON) |
| `public.garilink_save_listing(uuid,pg_catalog.bool)` | 20260909000000_marketplace.sql | — | listing_id, saved | jsonb | 12 references (JSON) |
| `public.garilink_saved_listings()` | 20260909000000_marketplace.sql | — |  | jsonb | 10 references (JSON) |
| `garilink_private.rental_json(public.gl_rentals,pg_catalog.bool)` | 20260912000000_rentals.sql | 20260915010000_transport_need_rental_json.sql, 20260915020000_transport_need_snapshot_protection.sql, 20260916020000_location_serialization_protection.sql, 20260922020000_rental_pricing_v1.sql | r, include_customer | jsonb | 24 references (JSON) |
| `public.garilink_create_rental(jsonb)` | 20260912000000_rentals.sql | 20260915000000_transport_need_v1.sql, 20260915040000_transport_need_legacy_retry.sql, 20260916010000_rental_location_snapshots.sql, 20260922000000_rental_requestability_guard.sql, 20260922030000_rental_price_estimate_v1.sql | input | jsonb | 18 references (JSON) |
| `public.garilink_my_rentals()` | 20260912000000_rentals.sql | — |  | jsonb | 7 references (JSON) |
| `public.garilink_cancel_rental(uuid)` | 20260912000000_rentals.sql | — | rental_id | jsonb | 7 references (JSON) |
| `public.garilink_workspace_rentals(uuid)` | 20260912000000_rentals.sql | — | workspace_id | jsonb | 7 references (JSON) |
| `public.garilink_rental_action(uuid,uuid,text,text)` | 20260912000000_rentals.sql | — | workspace_id, rental_id, action, reason | jsonb | 8 references (JSON) |
| `garilink_private.media_json(public.gl_vehicle_media)` | 20260912010000_vehicle_media.sql | — | m | jsonb | 8 references (JSON) |
| `public.garilink_reserve_vehicle_media(uuid,text)` | 20260912010000_vehicle_media.sql | — | vehicle_id, mime_type | jsonb | 9 references (JSON) |
| `public.garilink_finalize_vehicle_media(uuid,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)` | 20260912010000_vehicle_media.sql | 20260913001000_vehicle_media_finalize_repair.sql | media_id, byte_size, width, height | jsonb | 7 references (JSON) |
| `public.garilink_reorder_vehicle_media(uuid,uuid[])` | 20260912010000_vehicle_media.sql | — | vehicle_id, media_ids | jsonb | 7 references (JSON) |
| `public.garilink_vehicle_media_delete(uuid)` | 20260912010000_vehicle_media.sql | — | media_id | jsonb | 15 references (JSON) |
| `public.garilink_vehicle_media_delete_ticket(uuid)` | 20260912010000_vehicle_media.sql | — | media_id | jsonb | 6 references (JSON) |
| `garilink_private.require_listing_media()` | 20260912010000_vehicle_media.sql | — |  | trigger | 2 references (JSON) |
| `garilink_private.can_upload_media(text)` | 20260912010000_vehicle_media.sql | 20260913000000_vehicle_media_storage_policy_repair.sql | object_name | pg_catalog.bool | 12 references (JSON) |
| `garilink_private.can_delete_media(text)` | 20260912010000_vehicle_media.sql | 20260913000000_vehicle_media_storage_policy_repair.sql | object_name | pg_catalog.bool | 7 references (JSON) |
| `public.garilink_update_listing(uuid,jsonb)` | 20260912030000_seller_management.sql | — | listing_id, patch | jsonb | 10 references (JSON) |
| `garilink_private.validate_vehicle_capabilities(text,jsonb)` | 20260914000000_v2_vehicle_foundation.sql | 20260914020000_v2_capability_validator_fix.sql, 20260914030000_v2_capability_validator_ambiguity_fix.sql, 20260918000000_vehicle_suitability_matching.sql | category, value | jsonb | 29 references (JSON) |
| `garilink_private.v2_discovery_eligibility(public.gl_vehicles)` | 20260914000000_v2_vehicle_foundation.sql | 20260923000000_owner_workspace_context_and_availability_policy.sql | v | jsonb | 24 references (JSON) |
| `public.garilink_v2_update_vehicle(uuid,jsonb)` | 20260914000000_v2_vehicle_foundation.sql | 20260914040000_v2_rpc_parameter_ambiguity_fix.sql | vehicle_id, patch | jsonb | 16 references (JSON) |
| `public.garilink_v2_discoverable_vehicles()` | 20260914000000_v2_vehicle_foundation.sql | 20260916020000_location_serialization_protection.sql |  | jsonb | 6 references (JSON) |
| `public.garilink_v2_vehicle_eligibility(uuid)` | 20260914000000_v2_vehicle_foundation.sql | 20260914040000_v2_rpc_parameter_ambiguity_fix.sql | vehicle_id | jsonb | 10 references (JSON) |
| `garilink_private.v2_publication_readiness(public.gl_vehicles)` | 20260914010000_v2_owner_vehicle_activation.sql | — | v | jsonb | 4 references (JSON) |
| `public.garilink_v2_create_vehicle_draft(jsonb)` | 20260914010000_v2_owner_vehicle_activation.sql | — | input | jsonb | 7 references (JSON) |
| `public.garilink_v2_set_publication(uuid,text)` | 20260914010000_v2_owner_vehicle_activation.sql | 20260914040000_v2_rpc_parameter_ambiguity_fix.sql | vehicle_id, action | jsonb | 10 references (JSON) |
| `garilink_private.validate_transport_need(jsonb)` | 20260915000000_transport_need_v1.sql | 20260915030000_transport_need_validation_hardening.sql | p_need | jsonb | 10 references (JSON) |
| `garilink_private.protect_transport_need_snapshot()` | 20260915020000_transport_need_snapshot_protection.sql | — |  | trigger | 3 references (JSON) |
| `garilink_private.validate_location(jsonb)` | 20260916000000_location_privacy_foundation.sql | 20260916020000_location_serialization_protection.sql | input_value | jsonb | 12 references (JSON) |
| `public.garilink_v2_update_vehicle_location(uuid,jsonb)` | 20260916000000_location_privacy_foundation.sql | — | target_vehicle_id, location | jsonb | 7 references (JSON) |
| `garilink_private.protect_rental_locations()` | 20260916020000_location_serialization_protection.sql | — |  | trigger | 3 references (JSON) |
| `garilink_private.validate_location_v1(jsonb)` | 20260916020000_location_serialization_protection.sql | — | p_location | jsonb | 3 references (JSON) |
| `public.garilink_v2_vehicle_location(uuid)` | 20260916020000_location_serialization_protection.sql | — | p_vehicle_id | jsonb | 6 references (JSON) |
| `garilink_private.sync_vehicle_operational_geog()` | 20260917000000_postgis_nearby_discovery.sql | — |  | trigger | 3 references (JSON) |
| `garilink_private.nearby_config()` | 20260917000000_postgis_nearby_discovery.sql | — |  | jsonb | 4 references (JSON) |
| `public.garilink_v2_nearby_vehicles(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)` | 20260917000000_postgis_nearby_discovery.sql | — | p_latitude, p_longitude, p_radius_meters, p_limit, p_offset | jsonb | 5 references (JSON) |
| `garilink_private.evaluate_vehicle_suitability(jsonb,jsonb)` | 20260918000000_vehicle_suitability_matching.sql | — | p_transport_need, p_capabilities | jsonb | 5 references (JSON) |
| `public.garilink_v2_matched_vehicles(pg_catalog.float8,pg_catalog.float8,jsonb,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)` | 20260918000000_vehicle_suitability_matching.sql | — | p_latitude, p_longitude, p_transport_need, p_radius_meters, p_limit, p_offset | jsonb | 5 references (JSON) |
| `garilink_private.validate_rental_pricing_policy(jsonb)` | 20260922020000_rental_pricing_v1.sql | — | p_policy | jsonb | 5 references (JSON) |
| `garilink_private.rental_pricing_policy_json(public.gl_vehicle_rental_pricing)` | 20260922020000_rental_pricing_v1.sql | — | p | jsonb | 6 references (JSON) |
| `garilink_private.rental_pricing_summary(public.gl_vehicles)` | 20260922020000_rental_pricing_v1.sql | — | v | jsonb | 3 references (JSON) |
| `public.garilink_vehicle_rental_pricing(uuid)` | 20260922020000_rental_pricing_v1.sql | — | p_vehicle_id | jsonb | 7 references (JSON) |
| `public.garilink_update_vehicle_rental_pricing(uuid,jsonb)` | 20260922020000_rental_pricing_v1.sql | — | p_vehicle_id, p_policy | jsonb | 10 references (JSON) |
| `garilink_private.evaluate_rental_pricing_v1(jsonb,jsonb)` | 20260922020000_rental_pricing_v1.sql | — | p_policy, p_input | jsonb | 6 references (JSON) |
| `garilink_private.protect_pricing_estimate_snapshot()` | 20260922020000_rental_pricing_v1.sql | — |  | trigger | 3 references (JSON) |
| `garilink_private.rental_price_estimate_v1(jsonb,date,date,jsonb)` | 20260922030000_rental_price_estimate_v1.sql | — | p_policy, p_start, p_end, p_route_result | jsonb | 9 references (JSON) |
| `public.garilink_rental_estimate_context(uuid,date,date)` | 20260922030000_rental_price_estimate_v1.sql | — | p_listing_id, p_start_date, p_end_date | jsonb | 5 references (JSON) |
| `public.garilink_calculate_rental_estimate(uuid,uuid,date,date,jsonb)` | 20260922030000_rental_price_estimate_v1.sql | — | p_actor_id, p_listing_id, p_start_date, p_end_date, p_route_result | jsonb | 4 references (JSON) |
| `garilink_private.assign_workspace_business_mode()` | 20260927000000_workspace_business_mode_creation_policy.sql | — |  | trigger | 3 references (JSON) |
| `garilink_private.workspace_preparation_access(uuid,pg_catalog.bool)` | 20261009000000_email_first_preparation_access.sql | — | workspace_id, write_access | uuid | 10 references (JSON) |
| `garilink_private.vehicle_preparation_access(uuid)` | 20261009000000_email_first_preparation_access.sql | — | vehicle_id | uuid | 6 references (JSON) |


## Decision

GO for an explicitly authorized reviewed batch commit/push and third CI run; NO-GO for hosted deployment. Ask approval before committing/pushing this batch. Do not merge PR #1 or weaken any assertion.
