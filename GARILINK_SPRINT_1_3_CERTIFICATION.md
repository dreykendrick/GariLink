# GariLink Sprint 1.3 Certification

**Certified on:** 2026-09-20  
**Hosted project:** `yvcdkmsfuakjflmuatgz`  
**Verdict:** COMPLETE

## 1. Executive Summary

Sprint 1.3 adds privacy-preserving, server-side nearby rental discovery. The hosted Supabase project now stores a derived private PostGIS point for vehicles with valid operational coordinates, filters and orders nearby results in PostgreSQL, and returns only public vehicle data, coarse locality, availability/requestability, and a rounded distance.

The Flutter Explore surface now offers explicit foreground device location, an honest manual-location fallback, nearby loading/error/empty states, and a controlled 10 km to 25 km radius expansion. No maps, routing, pricing, suitability scoring, or background tracking were added.

## 2. Existing Discovery Audit

Existing V2 discovery already centralized rental-first eligibility in `garilink_private.v2_discovery_eligibility`, including publication, `FOR_HIRE`, configuration, workspace/account, and availability semantics. Nearby discovery is a separate public endpoint so `/v2/vehicles/discoverable` remains compatible.

## 3. PostGIS Deployment

Migration `20260917000000_postgis_nearby_discovery.sql` was applied through the linked Supabase migration workflow. Local and hosted migration histories are aligned through that migration.

## 4. Geography / Geometry Decision

The implementation uses `extensions.geography(Point, 4326)`. Geography is the appropriate model because nearby distance is measured over Earth coordinates in meters, rather than projected planar units.

## 5. Canonical Vehicle Geospatial Point and Synchronization

`gl_vehicles.operational_location` remains the authoritative private location. `operational_geog` is a derived internal field. A database trigger synchronizes it on insert/update and safely writes `NULL` when the canonical location lacks valid exact coordinates. No coordinates are fabricated.

## 6. Spatial Index and Query Performance

The migration adds partial GiST index `gl_vehicles_operational_geog_gist` for non-null points. Hosted `EXPLAIN (ANALYZE, BUFFERS)` against the controlled 10 km search used:

```
Index Scan using gl_vehicles_operational_geog_gist on gl_vehicles
Index Cond: operational_geog && _st_expand(..., 10000)
Filter: st_dwithin(..., 10000)
Execution Time: 148.101 ms
```

The result contained two controlled nearby rows. This proves index eligibility and use on the hosted query shape; it is not a production-scale benchmark.

## 7. Nearby Discovery Contract

`GET /v2/vehicles/nearby` accepts bounded `lat`, `lng`, `radiusMeters`, `limit`, and `offset` parameters. The `garilink_v2_nearby_vehicles` RPC validates all bounds server-side:

- radius: 500–100,000 m; default 10,000 m
- limit: 1–50; default 20
- offset: 0–1,000

Results use `ST_DWithin`, calculate distance server-side, order by distance then stable listing ID, and use offset pagination. Offset pagination is sufficient for the current bounded catalogue; cursor pagination is deferred until scale warrants it.

## 8. Privacy and Availability

Public responses contain coarse `publicLocality`, safe listing data, availability/requestability, and distance rounded to the nearest 100 m. They omit operational coordinates, `operational_location`, geography values, accuracy, private addresses, pickup/destination locations, and TransportNeed data.

Availability semantics are preserved: `AVAILABLE` is requestable; `BUSY` may remain discoverable but is not requestable; `UNAVAILABLE` and `MAINTENANCE` retain their existing eligibility behavior.

## 9. Flutter Integration

Typed `NearbySearchQuery`, `NearbyVehicle`, and `NearbyDiscoveryResult` isolate the API contract from widgets. The explicit user action “Use my location” performs only a foreground location request; no background permission or tracking exists. Manual locality-only selection remains usable without inventing coordinates and clearly explains that precise coordinates are required for nearby search.

## 10. Hosted Certification

`supabase/scripts/certify_nearby.mjs` completed with **9 passed, 0 failed**:

- known controlled vehicles included
- ascending distance ordering
- coarse locality present
- public privacy boundary preserved
- outside-radius vehicle excluded
- invalid latitude, radius, and limit inputs rejected safely

The endpoint is public, consistent with existing public discovery, while the RPC returns a curated DTO and does not grant raw private-location access.

## 11. Regression

| Check | Result |
| --- | --- |
| `npm test` | 79 passed, 0 failed |
| `dart format --set-exit-if-changed lib test` | clean; 0 changed |
| `flutter analyze --no-pub` | no issues |
| `flutter test --no-pub` | 94 passed, 0 failed |
| Hosted nearby certification | 9 passed, 0 failed |

## 12. Changed Areas

- `supabase/migrations/20260917000000_postgis_nearby_discovery.sql`
- `supabase/functions/garilink-api/handler.ts`
- `supabase/tests/nearby-discovery-api.test.ts`
- `supabase/scripts/certify_nearby.mjs`
- `mobile_flutter/lib/features/location/data/device_location_service.dart`
- `mobile_flutter/lib/features/explore/domain/nearby_discovery.dart`
- `mobile_flutter/lib/features/explore/data/repositories/nearby_discovery_repository.dart`
- `mobile_flutter/lib/features/explore/presentation/pages/explore_page.dart`
- `mobile_flutter/test/nearby_discovery_test.dart`
- Android/iOS foreground location declarations and nearby documentation

## 13. Cleanup and Deferred Work

Controlled evaluation accounts and fixtures remain available for team testing; no real inventory was changed. The controlled inventory may be paused before a public demo if it should not be visible.

Deferred intentionally:

- Sprint 1.4 suitability matching
- road/route distance and ETA
- distance pricing
- maps
- subscriptions and payments
- contact handoff
- live/background tracking

## 14. Sprint 1.4 Readiness

**READY.** The nearby output is typed, bounded, deterministic, privacy-preserving, and exposes the existing eligibility signals that a future suitability engine can consume without taking ownership of location logic.

## 15. Readiness Scores

| Area | Score |
| --- | ---: |
| PostGIS foundation | 95% |
| Geospatial query correctness | 94% |
| Discovery integration | 90% |
| Privacy confidence | 95% |
| Performance confidence | 85% |
| Flutter integration | 90% |
| Hosted certification | 94% |
| Regression confidence | 94% |
| Overall Sprint 1.3 readiness | 92% |

SPRINT 1.3: COMPLETE
