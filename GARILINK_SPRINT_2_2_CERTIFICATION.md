# GariLink Sprint 2.2 Certification

## Status

INCOMPLETE — provider-independent implementation, deployment and regression are complete; live provider certification is blocked by the absent `GOOGLE_ROUTES_API_KEY` secret.

## Objective

Build authoritative pickup-to-destination routed-distance infrastructure without activating renter price estimates.

## Starting baseline

INSPECTION — backend 84/84, Flutter 109/109, hosted pricing 36/36, formatter/analyzer clean.

## Routing audit

INSPECTION — no routing provider, SDK, key, route HTTP client or authoritative route calculation existed. The only distance was PostGIS discovery proximity and Pricing V1's future integer input contract.

## Existing location architecture

INSPECTION — GariLocation and rental snapshots support optional exact coordinates. Manual locality-only pickup/destination remains valid for rental operations but insufficient for routing. Flutter does not call external routing providers.

## Distance taxonomy

INSPECTION — discovery proximity, vehicle-to-pickup, rental trip and multi-leg distance are separately documented. Only routed pickup-to-destination is V1 pricing distance.

## Route Distance V1 definition

AUTOMATED — integer routed metres from confirmed pickup to confirmed destination, calculation version 1. No straight-line or vehicle distance fallback.

## Provider evaluation

INSPECTION — Google Routes, Mapbox, HERE, TomTom, OpenRouteService, GraphHopper and OSRM were considered for coverage, server compatibility, credentials, costs and failure behavior.

## Selected provider

INSPECTION — Google Routes Compute Routes with DRIVE/TRAFFIC_UNAWARE and a minimal field mask. A billing-enabled restricted key is required but unavailable.

## Provider abstraction

AUTOMATED — `RouteProvider`, `RouteService` and an isolated Google adapter are implemented. Deterministic test providers never enter production runtime.

## Route request model

AUTOMATED — typed origin, destination and explicit `DRIVING`; missing and malformed inputs are distinct.

## Route result model

AUTOMATED — typed canonical statuses, calculation version, integer distance, integer duration, timestamp and internal provider identity.

## Distance representation

AUTOMATED — safe integer metres, bounded 0–10,000,000.

## Duration representation

AUTOMATED — optional safe integer seconds, bounded to seven days; no ETA promise.

## Travel mode

AUTOMATED — only canonical `DRIVING`, mapped internally to Google `DRIVE`.

## Server authority

AUTOMATED + HOSTED — only Edge code can invoke the adapter; client distance is never accepted.

## API architecture

HOSTED — authenticated bounded `POST /v2/routes/resolve`, deployed in `garilink-api` version 18. Public DTO excludes vendor identity and raw provider data.

## Authorization / abuse boundary

AUTOMATED + HOSTED — anonymous use denied; body schema fixed; existing 16-KiB request limit retained; per-session Edge window permits six calls/minute. Durable cross-instance quota is deferred before volume rollout.

## Credential security

INSPECTION — `GOOGLE_ROUTES_API_KEY` is server-only and documented without a value. Hosted secret inventory confirms it is absent. No secret exists in Flutter or public DTOs.

## Error normalization

AUTOMATED — no route, timeout, rate limit, malformed response, HTTP failure and missing provider are canonical statuses without vendor payload leakage.

## Timeout/retry behavior

AUTOMATED — six-second timeout, zero automatic retries.

## Caching decision

INSPECTION — no persistent route cache; privacy/provider-term complexity is unjustified before route-estimate activation.

## Privacy

AUTOMATED + HOSTED — provider DTOs and public discovery expose no exact coordinates, secrets or raw responses. Safe logs contain status/category/latency only.

## Route snapshot strategy

INSPECTION — future immutable snapshot will associate calculation metadata with existing pickup/destination snapshots without duplicating coordinates. No migration yet; legacy snapshot remains null.

## Pricing Policy V1 integration boundary

AUTOMATED — integer `routeDistanceMeters` passes directly into Pricing V1 input. No estimate endpoint/UI was activated.

## Automated test matrix

AUTOMATED — 8 new route tests cover auth/abuse, valid mapping, missing/invalid points, no route, timeout, provider error, rate limit, malformed response, deterministic repetition, metres and Pricing V1 input.

## Hosted provider certification

BLOCKED — 9/9 provider-independent hosted checks pass, including legitimate auth, fail-closed behavior, input validation, privacy, anonymous denial and Phase 1 discovery. No live Google route is claimed because the required secret is absent.

## Real-world controlled route

BLOCKED — no billing-enabled Google Routes credential. No fake distance or public demo provider was substituted.

## Phase 1 regression

AUTOMATED + HOSTED — full tests pass; hosted discovery is healthy and retains its privacy boundary.

## Sprint 2.1 regression

HOSTED — `npm run certify:pricing` rerun after version 18 deployment: 36 passed, 0 failed; controlled fixtures paused and rental cleanup completed.

## Security regression

AUTOMATED + HOSTED — no anonymous route proxy, secret exposure, coordinate leak, geodesic billing fallback or provider internals.

## Backend regression

AUTOMATED — 92 passed, 0 failed, 0 skipped, exit 0.

## Flutter regression

AUTOMATED — formatter: 112 files, 0 changed, exit 0; analyzer: no issues, exit 0; tests: 109 passed, 0 failed, exit 0. The existing non-fatal `transport_need_test.dart` hit-test warning remains visible but does not fail the suite.

## Database/migration changes

NOT APPLICABLE — no persistence is required until Sprint 2.3 atomically activates route/estimate snapshots. Migration history was not changed.

## Deployment changes

HOSTED — `garilink-api` version 18 ACTIVE with route domain/adapter and fail-closed unconfigured behavior.

## Controlled fixture cleanup

HOSTED — route certification created no database fixture. Pricing regression cancelled its rental and paused controlled vehicles.

## Deferred scope

NOT APPLICABLE — renter estimates, price display/ranking, payments, route maps/geometry, navigation, traffic/ETA, geocoding, caching, dispatch/multi-leg routing and Sprint 2.3.

## Known non-blocking issues

In-memory rate limiting is per Edge isolate rather than a durable project-wide quota. This is safe for the currently credential-disabled endpoint but must be strengthened before volume activation.

## Sprint verdict

Required live provider certification and a real-world controlled route remain blocked by external credential/billing configuration.

SPRINT 2.2: INCOMPLETE
