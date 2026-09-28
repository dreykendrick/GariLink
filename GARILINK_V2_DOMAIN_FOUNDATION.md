# GariLink V2 Domain Foundation — Sprint 0.2

## Canonical model

`gl_vehicles` is the canonical physical vehicle asset, owned by a workspace.
`gl_listings` remains the legacy publication/discoverability record while the
application migrates. This distinction already existed structurally and is now
explicitly preserved.

## Implemented foundation

- `gl_workspaces.business_mode`: `INDIVIDUAL` or `FLEET`, backfilled from legacy
  workspace types without requiring re-onboarding.
- `gl_vehicles.vehicle_category`: controlled extensible text taxonomy, nullable
  for legacy records.
- `gl_vehicles.operational_availability`: `AVAILABLE`, `BUSY`, `UNAVAILABLE`,
  `MAINTENANCE`; default `UNAVAILABLE` for safe conservative compatibility.
- `gl_vehicles.capabilities`: nullable, validated schema-version-1 JSONB.
- Query-critical category, availability and workspace index.
- Server-authoritative owner patch RPC and public rental-only V2 discovery RPC.

## Predicates

`discoverable = published legacy FOR_HIRE publication + active verified
workspace/account + configured category + validated capabilities`.

`requestable = discoverable + operational_availability == AVAILABLE`.

BUSY vehicles remain discoverable but cannot be requested. Paused/archived
records are neither discoverable nor requestable. Exact location and private
operational data are not added or exposed in this sprint.

## Capability schema V1

Every configured payload requires `schema_version: 1`. Allowed fields are
transmission, fuel type, driver modes, passenger capacity, payload, cargo body
and cargo dimensions. Server validation rejects unknown keys, wrong types,
unsupported versions, negative cargo values, and passenger/payload category
mismatches. Future schemas require explicit migration/validator support.

## Compatibility and future extension points

Legacy vehicles remain valid and are simply absent from the V2 rental-only
discovery contract until an authorized owner configures V2 fields. Existing
listing, media, save and rental APIs remain intact. Future location/service
area, pricing configuration, transport needs, schedules and subscriptions
attach to the physical vehicle/workspace boundary without altering this model.
