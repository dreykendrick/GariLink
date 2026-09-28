# GariLink Sprint 2.4 Certification

## Status

Provider-independent Sprint 2.4 and Phase 2 engineering are complete. Route-dependent production activation remains blocked by the absent Google Routes credential.

## Objective

Certify pricing, routing, estimate, rental, renter-history, and owner-history behavior as one resilient product subsystem without adding payments or Phase 3 scope.

## Starting baseline

Sprint 2.1: 36 hosted checks. Sprint 2.2: 9 provider-independent hosted checks. Sprint 2.3: 46 hosted checks. Backend: 94 tests. Flutter: 111 tests.

## Phase 2 integration audit

`INSPECTION` traced Explore through booking, Trips, and owner requests. Defects found: missing stale-response protection; generic network errors mislabeled as route outages; legacy totals presented as authoritative estimates; and zero-capable legacy listing labels. Each received the smallest presentation/state fix. No pricing architecture or schema change was required.

## Canonical Phase 2 flow

`INSPECTION` TransportNeed and SearchLocation remain discovery inputs. Dates and pickup/destination become booking inputs. Policy decides whether RouteService is required. Rental creation revalidates authority and stores immutable request snapshots.

## Pricing vs payment semantics

`AUTOMATED/INSPECTION` UI now consistently says “Estimated rental price” and explains that payment is arranged outside GariLink. No checkout, amount-due, escrow, wallet, or payment mutation was added.

## Estimate availability semantics

`HOSTED` Estimate availability is independent of requestability. Missing pricing or routing produces no amount but does not independently disable rental creation.

## Request-without-estimate behavior

`HOSTED` Both unconfigured-policy and route-provider-unavailable rentals were created with null snapshots and appeared in renter and owner projections.

## Route-independent pricing flow

`HOSTED` Three-day preview and atomic snapshot were exactly TZS 265,000 without route-provider participation.

## Pricing-not-configured flow

`HOSTED` Returned `PRICING_NOT_CONFIGURED`, no zero amount, and a legitimate rental with null snapshot.

## Route-provider-unavailable flow

`HOSTED` Returned `ROUTE_UNAVAILABLE`, no amount, no fallback distance, while rental creation remained operational with null snapshot.

## Estimate state machine

`AUTOMATED/INSPECTION` IDLE, LOADING, ESTIMATED, INCOMPLETE_INPUT, PRICING_NOT_CONFIGURED, ROUTE_UNAVAILABLE, unsupported policy, and network ERROR are explicit.

## Input invalidation

`AUTOMATED` Date, pickup, destination, and selected-listing changes invalidate the preview.

## Async stale-response protection

`AUTOMATED` Generation-token tests prove late destination-A/date-A responses cannot replace newer B requests.

## Network/API resilience

`AUTOMATED/INSPECTION` Failure clears loading, displays safe retry guidance, leaves rental submission usable, and does not expose provider or database internals.

## Requestability integration

`HOSTED` BUSY, UNAVAILABLE, MAINTENANCE, and paused publication each rejected a rental after an earlier valid preview.

## Policy-change behavior

`HOSTED` A TZS 265,000 preview followed by a policy change produced a current TZS 295,000 request snapshot, not the stale preview.

## Historical snapshot behavior

`HOSTED` Later policy changes left renter and owner history at the original TZS 295,000 snapshot.

## Idempotency

`HOSTED` Exact retries returned the same rental and snapshot. Degraded retries returned the same rental and same null snapshot.

## Null-snapshot behavior

`AUTOMATED/HOSTED` Null is valid legacy/degraded history, never displayed as TZS 0, and never automatically backfilled.

## Vehicle detail pricing

`INSPECTION` Rental detail no longer advertises a legacy listing rate as a complete trip estimate. Truthful duration-component or “calculated during booking” language is used.

## Discovery pricing

`INSPECTION` No trip-specific estimate or price ranking is introduced before trip context. Sale asking price remains separate.

## Booking integration

`AUTOMATED/INSPECTION` Estimate errors are retryable and do not block Request rental. The action remains idempotent and protected from repeated taps while submitting.

## Renter Trips integration

`AUTOMATED/HOSTED` Trips shows the immutable estimate or “Estimate unavailable,” not legacy totals presented as Pricing V1.

## Owner request integration

`AUTOMATED/HOSTED` Owner cards, detail, and approval confirmation show the same snapshot or explicit unavailable state.

## Legacy compatibility

`AUTOMATED/HOSTED` Legacy nullable snapshots serialize without crashes or fabricated money. Legacy database fields remain unchanged.

## FOR_SALE separation

`HOSTED` Sale estimate and rental attempts were rejected; V2 rental discovery remained rental-only.

## Subscription/payment separation

`INSPECTION` Subscription pricing and off-platform renter-owner payments remain independent.

## Authorization

`HOSTED` Anonymous estimate access and owner self-estimation were denied. Existing tenancy and role regression remains green.

## Privacy

`HOSTED` Public payloads contained no private rental estimate, TransportNeed, pickup/destination, exact location, phone, route, or credential data.

## Routing cost discipline

`INSPECTION` Estimate is explicit, not rebuild-driven; no polling or retry storm was added. The adapter retains zero automatic retries.

## App lifecycle

`INSPECTION` Existing provider invalidation remains event/navigation based. No aggressive resume polling or automatic historical recalculation was added.

## Navigation

`AUTOMATED/INSPECTION` Listing identity is bound to booking state, selection is accepted only for the same listing, and changed listing identity invalidates estimation.

## Responsive/accessibility

`AUTOMATED` Existing 320/390/600 responsive tests and large-text tests remain green. Estimate status uses readable text, not color alone. Physical-device validation was not claimed.

## Performance

`INSPECTION` One explicit estimate mutation and one idempotent rental mutation per user action; no polling, rebuild request, or redundant route call.

## Hosted scenario matrix

| Scenario | Evidence | Result |
| --- | --- | --- |
| Route-independent preview/request/history | HOSTED | PASS |
| Pricing unconfigured/null snapshot | HOSTED | PASS |
| Route provider unavailable/null snapshot | HOSTED | PASS |
| Policy change before request | HOSTED | PASS |
| Historical immutability | HOSTED | PASS |
| Exact retry with snapshot | HOSTED | PASS |
| Exact retry without snapshot | HOSTED | PASS |
| BUSY after preview | HOSTED | PASS |
| UNAVAILABLE after preview | HOSTED | PASS |
| MAINTENANCE after preview | HOSTED | PASS |
| Pause after preview | HOSTED | PASS |
| FOR_SALE rejection | HOSTED | PASS |
| Unauthorized estimate | HOSTED | PASS |
| Legacy/null serialization | HOSTED | PASS |
| Public privacy | HOSTED | PASS |
| Phase 1 matching health | HOSTED | PASS |

Sprint 2.4 hosted Phase 2 certification: **68 passed, 0 failed**.

## Live Google certification

`BLOCKED` `GOOGLE_ROUTES_API_KEY` is not configured. No controlled provider is represented as live Google evidence.

## Phase 1 regression

`HOSTED` Sprint 1.5/Phase 1 integration: **61 passed, 0 failed**.

## Sprint 2.1 regression

`HOSTED` Pricing Policy V1: **36 passed, 0 failed**.

## Sprint 2.2 regression

`HOSTED` Provider-independent routing: **9 passed, 0 failed**. Sprint 2.2 formal live verdict is unchanged.

## Sprint 2.3 regression

`HOSTED` Rental Price Estimate V1: **46 passed, 0 failed**.

## Backend regression

`AUTOMATED` **94 passed, 0 failed, 0 skipped**.

## Flutter regression

`AUTOMATED` Formatter clean; analyzer no issues; definitive serial suite **114 passed, 0 failed, 0 skipped**, exit 0. The known non-fatal TransportNeed hit-test warning remains visible and was not suppressed.

## Database/migration changes

None. Applied migration history was not edited and hosted Supabase was not reset.

## Deployment changes

No Edge/database deployment was required: all Sprint 2.4 product fixes are Flutter presentation/state changes. Hosted `garilink-api` remains version 19.

## Controlled fixture cleanup

`HOSTED` Certification rentals cancelled; vehicles restored to AVAILABLE then paused; distance-aware Phase 2 policy restored; controlled accounts/media/evidence retained.

## Deferred scope

Payments, subscriptions, dispatch distance, multi-leg billing, live tracking, contact handoff, route UI redesign, and Phase 3 remain deferred.

## External blockers

Secure Google configuration, billing, enabled/restricted Routes API, and live Tanzania route certification.

## Known non-blocking issues

Route throttling remains per Edge isolate rather than durable/global. This is a pre-volume activation requirement, not falsely certified here.

## Phase 2 engineering verdict

Provider-independent Phase 2 behavior is coherent and resilient.

## Phase 2 production activation verdict

Route-dependent production activation remains blocked pending live Google certification.
