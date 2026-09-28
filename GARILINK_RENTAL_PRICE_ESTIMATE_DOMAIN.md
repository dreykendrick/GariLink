# GariLink Rental Price Estimate V1

## Purpose

Rental Price Estimate V1 composes a vehicle's Pricing Policy V1, an exclusive rental date interval, and—only when distance pricing is configured—a trusted RouteResult. The server is the sole pricing authority. Flutter submits trip intent and renders the returned result; it never submits a total, component amount, or route distance.

## Status contract

- `ESTIMATED`: an exact integer-TZS estimate is available.
- `PRICING_NOT_CONFIGURED`: the vehicle has no pricing policy. This is not a zero price.
- `INCOMPLETE_INPUT`: a required authoritative input is absent.
- `ROUTE_UNAVAILABLE`: distance pricing is configured but the route provider did not produce an authoritative route.
- Unsupported policy data fails validation rather than silently falling back.

## Versioning and exact arithmetic

Every successful estimate has `estimateVersion: 1` and `pricingPolicyVersion: 1`. Route-dependent estimates additionally have `routeCalculationVersion: 1`. Amounts are PostgreSQL integers in TZS; no floating point currency calculation occurs. Rental days use the exclusive interval `endDate - startDate`, from 1 through 366 days.

The component model is:

```text
raw = baseCharge
    + durationRatePerDay × rentalDays
    + ceil(distanceRatePerKilometer × routeDistanceMeters / 1000)
final = max(raw, minimumCharge)
minimumAdjustment = final - raw
```

## Authority boundary

`POST /v2/rentals/estimate` accepts only listing ID, dates, and pickup/destination intent. Authentication and current listing/requestability are rechecked. If the policy requires distance, the Edge Function invokes the RouteService and passes its canonical RouteResult through a service-role-only RPC. Direct client totals, components, and distance fields are rejected.

Discovery proximity is never used for pricing. There is no geodesic or straight-line fallback. Without a configured live provider, route-dependent preview returns `ROUTE_UNAVAILABLE` with no amount.

## Preview and staleness

Preview is an advisory view of current authoritative state. It is not reserved pricing. Flutter requests it explicitly and invalidates it when dates or locations change. Policy changes affect later previews and requests but do not rewrite existing rental history.

## Request-time snapshot

Rental creation recalculates and writes the estimate in the same PostgreSQL transaction as the rental. In the current provider-independent activation, this atomic snapshot is enabled for route-independent policies. Route-dependent creation remains compatible but stores a null estimate until the live provider path is activated and certified.

The snapshot is immutable. An exact idempotent retry returns the original rental and original snapshot, even if the pricing policy changed. Legacy rentals and route-dependent rentals with null snapshots remain valid. Authorized renter and workspace owner projections expose the same snapshot; public discovery does not expose rental history.

## Activation boundary

Provider-independent Sprint 2.3 engineering is deployable and certified. Full route-dependent production activation requires a securely configured `GOOGLE_ROUTES_API_KEY`, live Google route certification from Sprint 2.2, and live preview plus request-time snapshot evidence. Until then, the system fails closed.
