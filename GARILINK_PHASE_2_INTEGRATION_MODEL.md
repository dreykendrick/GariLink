# GariLink Phase 2 Integration Model

## Canonical end-to-end flow

Phase 2 composes TransportNeed, dates, pickup, destination, a requestable vehicle, Pricing Policy V1, and—only when required—Rental Route Distance V1. Discovery and suitability select a vehicle; they never calculate rental price. Booking asks the server for a preview, while rental creation independently revalidates all authority and stores the request-time result.

```text
TransportNeed + SearchLocation -> matched rental vehicle
vehicle + dates + pickup + destination -> estimate intent
policy without distance -> exact Pricing V1 estimate
policy with distance -> RouteService -> RouteResult -> exact Pricing V1 estimate
request -> current authorization/suitability/requestability/policy revalidation
        -> atomic rental plus immutable snapshots
```

## Pricing is not payment

`RentalPriceEstimate` is advisory pricing information, not a payment, charge, invoice, or amount due. GariLink does not collect rental payments. Renter and owner arrange payment outside the application.

Legacy listing `daily_rate` and rental `total_amount` remain stored for backward compatibility. They are not silently redefined as Pricing V1 estimates. Current renter and owner history presents the immutable estimate snapshot when one exists; otherwise it explicitly says that no authoritative estimate was recorded.

## Estimate availability and degraded rentals

Estimate availability is independent from rental authority. A renter may submit a legitimate request when:

- Pricing Policy V1 is not configured.
- A distance-aware policy exists but the route provider is unavailable.
- No authoritative route can legitimately be resolved.

The rental still preserves dates, TransportNeed, pickup, destination, vehicle, renter, workspace, and idempotency key. Its `pricing_estimate_snapshot` remains null. No zero, straight-line fallback, discovery distance, or stale estimate is substituted.

Provider outage therefore degrades price guidance but does not become a general rental outage. Current vehicle availability, publication, suitability, tenancy, conflicts, and authorization remain authoritative and can still reject the request.

## Route-independent and route-dependent behavior

Route-independent pricing uses current policy and exclusive rental days. It does not invoke RouteService or depend on Google configuration.

Route-dependent pricing accepts only pickup-to-destination Route Distance V1 in integer metres. Without an authoritative RouteResult it returns `ROUTE_UNAVAILABLE` without an amount. SearchLocation-to-vehicle proximity is discovery-only. Vehicle-to-pickup dispatch distance and multi-leg routing remain future domains.

## Preview, invalidation, and asynchronous safety

Preview is explicitly requested after dates are selected; it does not fire on every rebuild or locality keystroke. Date, pickup, destination, or selected-listing changes invalidate the preview. Every request receives a local generation identity. A response is applied only if its generation is still current, so late destination-A or dates-A responses cannot overwrite newer B inputs.

Network failure becomes a retryable `ERROR` presentation. It clears the loading state, does not retain an old amount as current, and does not disable the rental request action.

## Request-time authority and historical snapshots

Flutter never supplies an authoritative total or distance. The server recalculates route-independent estimates inside the same transaction that creates the rental. Policy changes between preview and submission therefore produce the current request-time result rather than persisting stale preview data.

After creation, database protection makes the snapshot immutable. Owner policy changes do not rewrite renter or owner history. An exact idempotent retry returns the original rental and original snapshot. This also applies to a null snapshot: later provider recovery does not silently backfill an earlier degraded request.

## Product surfaces

- Discovery and vehicle details show only truthful policy/listing context, never a trip estimate without trip inputs.
- Booking distinguishes IDLE, LOADING, ESTIMATED, INCOMPLETE_INPUT, PRICING_NOT_CONFIGURED, ROUTE_UNAVAILABLE, and ERROR.
- Trips and owner requests show the same historical estimate, or an explicit unavailable state without `TZS 0`.
- `FOR_SALE` asking prices never enter the rental estimate or rental request path.
- Subscription pricing and off-platform rental payment remain separate domains.

## Security, privacy, and cost discipline

Estimate and rental mutation require legitimate authentication. The service-only estimator receives the authenticated actor from the Edge boundary. Public discovery exposes neither private rental snapshots nor exact pickup/destination, route details, TransportNeed, private owner location, or credentials.

The architecture performs one logical estimate call per explicit stable intent and one idempotent rental mutation. There is no polling, automatic route retry, request-on-rebuild, or geodesic fallback. Route throttling remains per Edge isolate and must be replaced with durable global enforcement before material production volume.

## Google activation gate

Provider-independent Phase 2 remains safe without Google. Full route-dependent activation requires a restricted key, billing, enabled Routes API, secure Supabase Edge secret, a live Tanzania pickup-to-destination proof, live distance-aware estimate, and live request-time immutable snapshot certification. Controlled-provider tests are not live Google evidence.
