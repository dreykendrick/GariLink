# GariLink V2 Controlled Migration Map

## Strategy

Every material change follows **expand -> migrate/backfill -> dual read/write
where necessary -> validate -> switch reads -> deprecate -> later cleanup**.
No Sprint 0.1 schema, data, Storage, RLS or hosted configuration change occurs.

| Subsystem | Current | Transition | Target | Risk |
|---|---|---|---|---|
| Product copy | Sale-capable marketplace vocabulary | Centralize user-facing terminology | Rental/transport language | Low |
| Workspaces | broad legacy workspace types, memberships | map types; add owner/fleet presentation fields | individual/fleet tenant workspace | Medium |
| Vehicle/listing | `gl_vehicles.specs`, `gl_listings.type FOR_SALE/FOR_HIRE`, one price | add rental profile/capability/availability columns; backfill only hire records | rental vehicle profile | High |
| Publication | listing statuses include SOLD | preserve reads, add separate availability | publication + operational availability | High |
| Location | county text | add private/public/service-area locations after privacy review | geospatial discovery | Critical |
| Search | county/type/price filters, public listings | add versioned rental discovery endpoint | suitability/proximity search | High |
| Rental | date request, daily rate, conflict exclusion, owner actions | add immutable transport/estimate snapshot and compatible transitions | transport-aware request lifecycle | High |
| Pricing | daily listing price -> total | add estimate configuration/snapshot | transparent estimated pricing | High |
| Subscription | capability grant per user | introduce workspace plans/entitlements without enforcement | workspace subscription | Critical |
| API | `/listings`, `/rentals`, owner routes and RPCs | version DTOs; retain old endpoint readers during app rollout | rental discovery API | High |
| Flutter | marketplace/listing/seller screens | feature flags/parallel repositories where needed | renter + workspace experience | Medium |
| Tests | marketplace and rental tests | preserve security/regression; update terminology expectations | domain and migration coverage | Medium |

### Sprint 0.2 status

| Item | Status | Evidence |
|---|---|---|
| physical vehicle vs publication | IMPLEMENTED | documented and retained in V2 migration |
| workspace business mode | IMPLEMENTED | additive backfilled column |
| category/capabilities/availability | IMPLEMENTED | V2 foundation migration, RPC and Flutter types |
| rental-only V2 discovery predicate | IMPLEMENTED | central database function/RPC |
| full discovery/location/pricing/subscription | DEFERRED | explicit future boundaries |
| consumer screen switch | DEFERRED | compatibility preserved |

### Sprint 0.3 status

| Item | Status | Evidence |
|---|---|---|
| Owner V2 vehicle configuration | CODE READY | V2 rental-first draft RPC, typed Flutter category/capability form |
| V2 publication activation | CODE READY | server readiness gate and path-scoped publication RPC |
| Controlled V2 discovery | CODE READY | existing predicate now receives owner-configured supply |
| Hosted migration/function deployment | PENDING | no hosted schema or Edge Function change was applied in this sprint |

## Database and security inventory

| Existing object | Current purpose | V2 purpose | Action | Risk |
|---|---|---|---|---|
| `gl_accounts`, `gl_profiles` | verified identity/profile | shared renter/owner identity | Keep | Critical |
| `gl_user_roles`, `gl_capabilities` | account roles/capabilities | transitional access; subscription must not self-grant | Refactor | Critical |
| `gl_workspaces`, members | tenant/workspace permissions | owner/fleet tenancy | Keep/repurpose | High |
| `gl_vehicles.specs` | vehicle JSON specs | transition vehicle metadata | Refactor | High |
| `gl_listings` | sale/hire publication and price | transitional rental profile | Migrate | High |
| saved listings | user favourites | saved vehicles | Rename user-facing | Low |
| `gl_rentals` | date rental request/status/conflicts | transport-aware rental request | Migrate | Critical |
| `gl_vehicle_media`/Storage | private vehicle media | unchanged media ownership | Keep | Critical |
| listing media trigger | requires photo to publish | requires media for discoverability | Repurpose | Medium |
| RPCs / Edge API | narrow authenticated actions | version/extend with compatibility | Refactor | High |
| RLS/grants/security definers | server-authoritative isolation | maintain tenant and request isolation | Keep then extend | Critical |

## Required future migration gates

1. Founder decisions in the decision register are resolved.
2. Write SQL migration plus RLS/RPC tests before each schema change.
3. Backfill only reviewed data; never infer private location or capability.
4. Ship compatible API readers before switching Flutter writers.
5. Verify renter, owner, fleet isolation and media ownership on hosted staging.
6. Observe production error rates and rollback compatibility before deprecation.

## Product-debt register

| Debt | Severity | Subsystem | Future sprint | Risk |
|---|---|---|---|---|
| `FOR_SALE`, `SOLD`, asking price | High | listing/domain | rental-profile migration | data/API |
| seller/dealer/buyer copy | Medium | Flutter/docs | terminology pass | low |
| county-only discovery | High | search/location | geospatial | privacy/query |
| publication conflated with availability | High | listing/rental | availability | booking conflict |
| request lacks route/need snapshot | High | rentals | transport request | integrity |
| user capability vs workspace subscription | High | access/monetization | entitlement | authorization |
| phone included for workspace rental views | High | privacy | contact handoff | disclosure |

## Security, privacy and performance

Keep service role in Edge Functions/admin scripts only. RLS/RPC must prove
workspace isolation, renter-only request creation, owner-only actions and no
client-issued entitlement or estimate authority. New sensitive data includes
location, routes, phone, ownership, rental history, cargo descriptions and
organization data. Nearby queries need spatial indexes; list feeds need
workspace/status/time indexes; signed media must remain lazy and scoped.

## Flutter, API and test impact

| Current Flutter module | V2 role | Action |
|---|---|---|
| `home_page.dart` | renter entry/discovery | Major refactor after discovery contract |
| `explore_page.dart` | available/nearby vehicles | Major refactor |
| `vehicle_details_page.dart` | rental vehicle profile | Refactor |
| `saved_vehicles_page.dart` | saved rental vehicles | Mostly keep |
| `booking_page.dart` | transport rental request | Extend |
| `trips_page.dart`, `rental_details_page.dart` | renter request status | Refactor lifecycle/copy |
| `owner_dashboard_page.dart` | owner/fleet operations | Refactor |
| `my_vehicles_page.dart` | owner/fleet vehicles | Refactor terminology/configuration |
| `create_listing_page.dart` | add vehicle | Refactor |
| `vehicle_media_page.dart` | vehicle media | Keep |
| `incoming_requests_page.dart` | owner requests | Extend transport context |
| `profile_page.dart` | shared renter/workspace identity | Refactor |

Existing API contracts are narrow RPC facades and are an advantage. `/listings`
and listing DTOs need versioned extension/replacement; `/rentals` needs an
extended request contract; `/workspaces`, `/media` and signed URLs can remain
compatible. Do not expose direct PostgREST table access to solve V2 features.

| Existing tests | Classification | Future action |
|---|---|---|
| auth/session/API client/release config | Unchanged | retain |
| vehicle media/security/RLS/API media | Unchanged | retain and add tenant cases |
| workspace/owner draft | Refactor expectations | new owner/fleet terminology/config |
| marketplace showcase/search | Refactor | discovery/capability/availability fixtures |
| rental experience/API | Refactor | state transitions, transport snapshots, estimates |
| responsive/design system | Unchanged | retain |
| pricing/location/subscription/fleet | New coverage required | add before implementation |

## Sprint 1.2 Location Foundation
- 20260916000000_location_privacy_foundation.sql: private operational location, coarse public locality, location validator and owner RPC.
- 20260916010000_rental_location_snapshots.sql: atomic optional pickup/destination snapshots on rental creation.
- 20260916020000_location_serialization_protection.sql: strict typed-location validation, immutable rental location snapshots, authorized vehicle readback, and safe public locality projection.
- 20260917000000_postgis_nearby_discovery.sql: PostGIS geography synchronization, GiST index, bounded nearby discovery RPC, and rounded safe distance projection.
- 20260918000000_vehicle_suitability_matching.sql: Suitability V1 evaluator, long-distance capability validation, and bounded nearby-plus-suitable discovery RPC.
Hosted deployment: Supabase project yvcdkmsfuakjflmuatgz. Legacy vehicles/rentals remain valid with NULL locations; exact coordinates are private.
