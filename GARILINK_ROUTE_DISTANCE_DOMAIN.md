# GariLink Route Distance Domain

## Distance taxonomy

- **Discovery proximity:** SearchLocation to vehicle operational location. PostGIS/geodesic, approximate and public-safe. Never billable.
- **Vehicle-to-pickup distance:** operational vehicle location to pickup. Future dispatch/logistics input, not V1 billing distance.
- **Rental trip distance:** confirmed pickup to confirmed destination through a routing engine. This is Route Distance V1.
- **Multi-leg distance:** vehicle to pickup to destination. Deferred and never silently added to V1.

## Route Distance V1

`routeDistanceMeters` is the routed driving distance from confirmed pickup coordinates to confirmed destination coordinates. It is an integer number of metres. It is not a straight line, SearchLocation distance, vehicle proximity, vehicle-to-pickup distance, locality estimate or manually supplied kilometre value.

## Route request

`RouteRequest` contains exact origin/pickup coordinates, exact destination coordinates and canonical `DRIVING` mode. Both coordinates are required and range-validated. Locality-only manual locations are `INCOMPLETE_INPUT`; they are never geocoded or guessed in this sprint.

## Route result

Canonical statuses are `ROUTE_AVAILABLE`, `INCOMPLETE_INPUT`, `INVALID_ROUTE_INPUT`, `NO_ROUTE`, `PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE` and `RATE_LIMITED`. An available result contains calculation version 1, integer metres, optional integer seconds and calculation timestamp. Zero distance is numeric and is never used to mean unavailable.

## Provider decision

Google Routes API Compute Routes is the selected V1 adapter. The server requests only `routes.distanceMeters` and `routes.duration`, uses `DRIVE` with `TRAFFIC_UNAWARE`, requests no geometry and performs no Flutter SDK integration. The choice fits the existing Supabase Edge REST boundary, supports future large-vehicle evolution, and provides a stable server API. It requires a billing-enabled, Routes-API-restricted key.

Alternatives considered were Mapbox Directions, HERE, TomTom, OpenRouteService, GraphHopper and OSRM. No provider was already configured. A public/demo OSRM-style endpoint was rejected as production authority because it is not project-controlled infrastructure with an appropriate production SLA/quota boundary.

References: [Google Routes API](https://developers.google.com/maps/documentation/routes), [Compute Routes](https://developers.google.com/maps/documentation/routes/compute_route_directions), [usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing), and [policy requirements](https://developers.google.com/maps/documentation/routes/policies).

## Provider abstraction

Domain code depends on `RouteProvider.resolveRoute(RouteRequest)`, not Google-specific response types. `RouteService` owns validation and provider availability. `createGoogleRoutesProvider` owns HTTP mapping and raw response validation.

## Credential security

`GOOGLE_ROUTES_API_KEY` is read only by the Edge Function. It is absent from Flutter, public DTOs, logs and repository values. Production configuration must restrict the key to Routes API and set cost quotas.

## Timeout, retry and errors

Provider calls have a six-second timeout and no automatic retry, preventing duplicated provider cost. Vendor HTTP/body details become canonical safe statuses. No route or provider failure ever falls back to PostGIS distance.

## Privacy and observability

Exact endpoints are processed only in authenticated server memory and sent to the selected provider. Public results omit coordinates, provider identity and raw response. Safe logs contain request correlation ID, canonical status, provider category and latency—never coordinates, user identity, secrets or response bodies.

## Authorization and abuse boundary

`POST /v2/routes/resolve` requires a valid GariLink session, accepts only two points and DRIVING mode, limits JSON size through the existing API reader and applies a six-request-per-minute per-session Edge window. It is not an anonymous provider proxy. Durable cross-instance quotas remain a production-hardening item before high-volume activation.

## Caching decision

No persistent cache was introduced. Coordinate caching increases privacy and provider-terms complexity, while no renter estimate flow yet needs repeated calls. One route operation performs one provider call. Historical snapshots—not caches—will preserve finalized evidence.

## Route snapshot strategy

A future immutable rental route snapshot will contain calculation version, integer distance, optional duration, internal provider identity and calculation timestamp, associated with the existing immutable pickup/destination snapshots. It should not duplicate exact coordinates. Existing rentals remain valid with a null route snapshot. Persistence is deferred until Sprint 2.3 activates the atomic route-to-estimate workflow.

## Pricing boundary

`RouteResult.routeDistanceMeters` feeds Pricing Policy V1 without conversion or floating arithmetic. Automated tests prove the integer contract. Sprint 2.2 does not invoke pricing for renters, show a price, or populate `pricing_estimate_snapshot`.

## Deferred features

Geocoding, route geometry/maps, ETA promises, traffic, navigation, dispatch/multi-leg distance, durable distributed rate limiting, caching, snapshot persistence, renter price estimates, payments and dynamic pricing are deferred.
