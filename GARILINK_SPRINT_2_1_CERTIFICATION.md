# GariLink Sprint 2.1 Certification

## Status

COMPLETE — certified 2026-09-22 against hosted project `yvcdkmsfuakjflmuatgz`.

## Objective

Establish an exact, versioned and owner-authorized rental-pricing domain without inventing route distance, activating renter estimates/payments, or changing Phase 1 matching semantics.

## Phase 1 baseline

INSPECTION — pre-sprint baseline was 83 backend tests, 105 Flutter tests and 61 hosted Phase 1 checks. Sprint 2.1 preserved TransportNeed, location, matching, media and rental contracts.

## Pricing audit

INSPECTION — pricing was traced through listing creation/editing, discovery/detail serialization, booking presentation, rental creation and persisted rental reads. `gl_listings.price` was the only prior price input and served two meanings depending on listing type.

## Legacy pricing findings

INSPECTION — `FOR_SALE` uses `gl_listings.price` as asking price. `FOR_HIRE` uses it as daily rate. Rental creation authoritatively snapshots `daily_rate`, `currency` and `total_amount`; Flutter's booking total is presentation-only. These fields remain compatible and were not rewritten or backfilled.

## Canonical terminology

INSPECTION — rental pricing policy, price estimate, payment, owner subscription and sale asking price are separate concepts. Pricing is neither payment collection nor subscription billing.

## Pricing Policy V1

AUTOMATED + HOSTED — vehicle/workspace-scoped policy with `policyVersion: 1`, `currency: TZS`, and optional base, minimum, per-day and per-route-kilometre components. At least one component must be positive. Absence is `configured: false`.

## Money representation

AUTOMATED + HOSTED — all new authoritative amounts are bounded PostgreSQL `bigint` and Dart `int` values. One integer unit equals one TZS. Fractional, negative and out-of-range inputs are rejected.

## Currency model

AUTOMATED + HOSTED — V1 supports only canonical `TZS`; unsupported currency is rejected server-side.

## Base charge semantics

INSPECTION — optional fixed amount included once in a future estimate.

## Minimum charge semantics

AUTOMATED — optional floor applied after base, duration and distance components. It cannot be below the base charge.

## Duration semantics

AUTOMATED — future estimates use exclusive-end whole calendar days, minimum one and maximum 366. The owner form writes the existing rental daily rate explicitly as the V1 per-day component.

## Distance-input contract

INSPECTION + AUTOMATED — future route distance is authoritative integer `routeDistanceMeters`. Phase 1 proximity distance is never billing distance. A distance-priced policy without route distance returns `INCOMPLETE_INPUT`, not a fabricated amount.

## Pricing engine boundary

AUTOMATED — private, pure, versioned `evaluate_rental_pricing_v1` validates policy/input, calculates exact components, uses half-up metre conversion, applies the minimum and returns an explicit status. It is not a renter endpoint.

## Vehicle pricing configuration

HOSTED — an authorized owner configured deterministic V1 pricing and read it repeatedly with exact values. Flutter supports optional base, minimum and route-kilometre inputs alongside the daily rate.

## Owner authorization

HOSTED — normal owner authentication and workspace access passed. Renter mutation was denied, anonymous mutation returned 401, and unrelated/unknown vehicle mutation was denied. RPCs require workspace access plus `MANAGE_RENTAL_LISTINGS`.

## Public pricing exposure

HOSTED — public V2 discovery exposed only the safe component summary and omitted updater identity, private contact/registration information and secrets. Unconfigured state is explicit.

## Estimate-result model

AUTOMATED — Flutter has typed estimate status, components, exact amounts and missing-input representation. Renter estimate activation is deferred until authoritative route input exists.

## Historical snapshot strategy

AUTOMATED + HOSTED — nullable `gl_rentals.pricing_estimate_snapshot` is immutable after creation. Current rental creation leaves it null, preventing fake historical estimates while preserving the future audit boundary.

## Legacy vehicle compatibility

HOSTED — unconfigured controlled inventory read as `configured: false`, remained valid, and required no fabricated backfill.

## Legacy rental compatibility

HOSTED — a controlled rental was created and cancelled after policy configuration. Existing total calculation remained compatible and `pricingEstimate` remained null.

## Migration changes

HOSTED — `20260922020000_rental_pricing_v1.sql` applied and is recorded locally/remotely. It adds the pricing table/index, RLS/revokes, validation/evaluation helpers, owner RPCs, safe serialization and immutable snapshot column/trigger. No reset or historical migration edit occurred.

## API changes

AUTOMATED + HOSTED — authenticated `GET/PATCH /v2/vehicles/:id/pricing` routes dispatch to path-scoped RPCs. `garilink-api` deployed ACTIVE as version 17.

## Flutter changes

AUTOMATED — added typed policy/estimate models, repository operations, owner inputs/validation, marketplace mapping, vehicle-detail pricing state, rental snapshot compatibility and test coverage.

## Hosted certification

HOSTED — `npm run certify:pricing`: 36 passed, 0 failed. Evidence covers legitimate auth, workspace/inventory, configured/unconfigured state, exact round-trip, invalid inputs, actor isolation, discovery/privacy, FOR_SALE exclusion, rental regression, pause/republish and cleanup.

## Security/privacy

HOSTED + INSPECTION — direct table access is revoked, RLS enabled, mutations use capability-checked workspace RPCs, private helpers are not granted, errors expose no SQL internals, and public payload inspection found no private owner data.

## Determinism

AUTOMATED + HOSTED — integer round-trips and repeated hosted reads were identical. SQL assertions cover exact result `283750`, minimum floor `50000`, missing-distance status and snapshot immutability. Local SQL was NOT EXECUTED because PostgreSQL port 5433 was offline and Docker unavailable; deployed hosted behavior was directly verified.

## Phase 1 regression

HOSTED + AUTOMATED — discovery remained rental-only, a legacy rental succeeded, publication pause/republish worked, and all existing backend/Flutter suites stayed green.

## Backend regression

AUTOMATED — `npm test`: 84 passed, 0 failed, 0 skipped, exit 0.

## Flutter regression

AUTOMATED — format: 112 files, 0 changed, exit 0. Analyzer: no issues, exit 0. Tests: 109 passed, 0 failed, exit 0.

## Controlled fixture cleanup

HOSTED — certification rental cancelled; both controlled vehicles paused; accounts, approved media and evidence retained. One controlled vehicle policy is intentionally retained for Phase 2; no fake inventory remains discoverable.

## Deferred scope

NOT APPLICABLE — routing/directions/geometry, ETA/traffic, renter estimate endpoint, payment/payout/escrow/commission, subscriptions, price ranking, surge/ML/AI pricing, chat/contact/live tracking and Sprint 2.2 were not implemented.

## Known non-blocking issues

Local SQL assertions require a running local PostgreSQL/Supabase stack. The Flutter suite emits one existing non-fatal tap hit-test warning in `transport_need_test.dart`, but completes 109/109 with exit 0.

## Sprint verdict

All required implementation, hosted certification, regression, privacy and cleanup gates passed. The unavailable redundant local SQL mirror is not a hosted production blocker.

SPRINT 2.1: COMPLETE
