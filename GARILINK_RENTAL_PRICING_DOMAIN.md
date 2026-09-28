# GariLink Rental Pricing Domain

## Terminology

Rental pricing describes an estimated renter-to-owner vehicle-hire amount. It is not a collected payment, invoice, settlement, owner payout, platform commission, or owner subscription. Actual rental payment remains arranged outside GariLink.

Owner subscription is a separate future owner-to-GariLink domain and is not represented by Pricing Policy V1.

## Existing legacy pricing

`gl_listings.price` is a legacy dual-purpose value: an asking price for `FOR_SALE` and a daily listing rate for `FOR_HIRE`. Rental creation snapshots that rental listing rate into `gl_rentals.daily_rate` and computes `total_amount = daily_rate × (end_date - start_date)`. Those values remain valid historical legacy fields. They are not silently migrated into the new policy domain.

## Pricing Policy V1

Pricing Policy V1 is attached to a physical vehicle and its workspace. Table existence means configured; absence means explicitly unconfigured. A policy contains:

- `policyVersion = 1`
- `currency = TZS`
- optional base charge
- optional minimum charge
- optional duration rate per day
- optional distance rate per route kilometre

At least one component must be greater than zero. Every amount is owner-configured and validated server-side. Vehicle category does not modify pricing implicitly.

## Money representation

Authoritative values are signed 64-bit database integers bounded to `0..999,999,999,999`. API/Dart models call them `*Minor`; for V1 TZS, one stored minor unit equals one Tanzanian shilling because TZS has no fractional operational unit in this policy. Formatted strings and binary floating-point are never authoritative.

## Currency semantics

V1 accepts only the explicit ISO currency code `TZS`. Supporting another currency requires a future version with documented minor-unit semantics; values cannot be reinterpreted merely by changing a display label.

## Component semantics

- **Base charge:** fixed starting component, independent of duration/distance.
- **Minimum charge:** floor applied after all configured components. It cannot be below base charge.
- **Duration charge:** `durationRateMinorPerDay × (endDate - startDate)`. End date is exclusive, matching the existing rental engine. Valid duration is 1–366 days.
- **Distance charge:** `distanceRateMinorPerKilometer × routeDistanceMeters / 1000`, rounded half-up once to an integer minor unit.

No driver, cargo, category, surge, commission, deposit, subscription, or payment modifier exists in V1.

## Distance-input contract

The canonical future pricing input is integer `routeDistanceMeters`. It represents authoritative route/trip distance from a later routing integration. Phase 1 PostGIS proximity distance, rounded public distance, and straight-line distance are forbidden pricing inputs.

If a policy has a distance rate and route distance is unavailable, the engine returns `INCOMPLETE_INPUT` with `ROUTE_DISTANCE_METERS`; it never produces a fake estimate.

## Authoritative calculation boundary

`garilink_private.evaluate_rental_pricing_v1(policy,input)` is deterministic, version-aware, exact-money safe, and independent of Flutter. It returns either:

- `ESTIMABLE` with component breakdown, raw amount, minimum adjustment, and final estimated amount; or
- `INCOMPLETE_INPUT` with missing inputs.

No public renter estimate endpoint is exposed in Sprint 2.1 because authoritative route distance does not yet exist. Flutter never submits a final amount.

## Owner configuration

Only a workspace actor with existing vehicle access and `MANAGE_RENTAL_LISTINGS` capability may read/update full configuration. The API surface is:

- `GET /v2/vehicles/{vehicleId}/pricing`
- `PATCH /v2/vehicles/{vehicleId}/pricing`

The owner vehicle editor explains offline payment and route-distance deferral. The existing daily-rate input explicitly configures the V1 duration rate on save; base, minimum, and route-kilometre rate are optional owner inputs.

## Public pricing summary

Public vehicle serialization exposes only safe configuration fields under `rentalPricing`. Unconfigured vehicles return `{configured:false}` rather than zero. Configured policies expose version, currency, and components so the UI can explain that pricing is configured, but no final estimate is claimed without all required inputs.

## Historical snapshots

`gl_rentals.pricing_estimate_snapshot` is nullable and immutable. Existing and current rentals remain null until a later sprint connects authoritative route estimation to rental creation. A future snapshot can preserve version, currency, validated inputs, components, rounding, and final estimate. Historical rentals must never read the owner's current policy as their historical price.

## Compatibility and staged activation

Existing vehicles remain discoverable with `configured:false`; pricing is not a publication-readiness requirement in Sprint 2.1. Existing rentals retain their legacy daily-rate history and null pricing snapshot. No fabricated backfill occurs. A later activation sprint may require configured pricing only after owners have a safe migration path.

## Future route integration

Sprint 2.2 may supply authoritative `routeDistanceMeters` through a selected route provider. It must not change Policy V1 semantics or substitute discovery distance. The estimate should then be calculated server-side and snapshotted atomically when the product explicitly activates that flow.

## Deferred items

Routing provider selection, route geometry, ETA/traffic, renter estimate endpoint, policy activation, payment, payout, commission, owner subscription, contact handoff, dynamic/surge pricing, and AI recommendations are deferred.
