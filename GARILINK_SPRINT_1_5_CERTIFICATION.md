# GariLink Sprint 1.5 Certification

## Status

Complete on 22 September 2026 against hosted Supabase project `yvcdkmsfuakjflmuatgz`.

Evidence labels used below:

- **Automated** — repository test/analyzer/formatter process completed with exit code 0.
- **Hosted** — exercised through the deployed GariLink Edge API and normal Supabase authentication against the hosted project.
- **Inspection** — verified from the final application/navigation/database implementation; not represented as a physical-device run.

## Objective

Certify the complete Phase 1 journey from mutable renter intent through privacy-safe matching, vehicle detail, authoritative rental creation, immutable snapshots, owner action, and renter-visible lifecycle state.

## Existing certified foundations

Sprints 1.1–1.4 remain intact. The final regression is 83/83 backend tests and 105/105 Flutter tests, with formatter and analyzer clean.

## Integration audit

The audit found five integration seams:

1. matched results did not navigate to vehicle detail;
2. discovery context was discarded by detail/booking routes;
3. booking rebuilt an empty TransportNeed instead of carrying renter intent;
4. detail enabled booking from `FOR_HIRE` alone rather than current requestability;
5. rental submission did not authoritatively re-check current V2 availability/suitability.

Hosted testing found one additional pre-existing regression: V2 owner activation had replaced the media-aware vehicle serializer with `images: []` even though READY media remained intact.

## Changes required

Implemented the smallest compatible changes:

- introduced typed, route-scoped `DiscoverySelection` state;
- connected matched results to detail and booking;
- prepopulated booking with the selected TransportNeed;
- kept SearchLocation distinct from explicitly entered pickup/destination;
- refreshed detail eligibility and disabled stale/non-suitable CTAs;
- invalidated Trips after creation and refreshed renter/owner rental data on app resume;
- sanitized renter/owner action errors;
- added a forward-only authoritative rental requestability/suitability guard;
- restored READY vehicle media in the shared V2 serializer;
- added targeted Flutter and SQL regression assertions;
- added a repeatable hosted Phase 1 certification/cleanup script.

## Renter flow certification

**Hosted PASS.** Normal controlled renter authentication, TransportNeed, SearchLocation, PostGIS matching, detail load, booking payload, rental creation, Trips retrieval, and lifecycle refresh were exercised through the deployed API. Both passenger and cargo paths passed.

## State continuity

**Automated + inspection PASS.** Typed route state preserves the selected listing, TransportNeed, SearchLocation, and SuitabilityResult from Explore to detail to booking. Explore remains mounted beneath pushed routes, so back navigation retains its existing Riverpod/local search state. Editing the need/location continues to invalidate matched provider inputs.

## Vehicle-detail integration

**Automated + hosted PASS.** Matched cards open the correct listing. Detail can still be opened without discovery context. Current public eligibility is merged into the detail response; BUSY/non-requestable listings show safe copy and cannot open booking. Suitability uses existing human-readable reasons and no fabricated score.

## Booking integration

**Automated + hosted PASS.** Booking starts with the matched TransportNeed, retains editable form values, collects pickup/destination separately, and explicitly explains that the search area is not pickup. The submitted hosted payload contained the final need plus explicit pickup/destination.

## Rental snapshot certification

**Hosted PASS.** Passenger and cargo rentals returned exactly the submitted TransportNeed, pickup, and destination snapshots. Authorized renter and owner reads returned the same snapshots.

## Idempotency

**Automated + hosted PASS.** An identical retry returned the same rental ID and Trips contained one record. A delayed identical retry remained recoverable after availability changed. Existing changed-payload request-ID conflict coverage remains green.

## Snapshot immutability

**Hosted + automated PASS.** Later mutation of discovery intent did not change stored rental requirements. Database snapshot-protection migrations remain applied. Rental reads after vehicle state changes retained the original need/location history.

## Renter Trips integration

**Hosted + inspection PASS.** The request appeared once in the renter's canonical `/rentals` response with vehicle, dates, snapshots, and state. Successful booking invalidates `myTripsProvider`; app resume refreshes it.

## Owner request integration

**Hosted + inspection PASS.** The correct controlled workspace received both requests and saw authorized renter, dates, requirements, pickup, and destination data. Owner requests refresh on resume.

## Owner accept/reject

**Hosted PASS.** Passenger request: REQUESTED → APPROVED and renter refresh showed APPROVED. Cargo request: REQUESTED → REJECTED and renter refresh showed REJECTED. A second overlapping request reached review but approval returned a sanitized HTTP 409, preserving the conflict engine.

## Stale requestability

**Hosted PASS.** After an AVAILABLE/SUITABLE passenger match, the owner changed availability to BUSY. A new stale submission returned HTTP 409 and created no rental. BUSY, UNAVAILABLE, and MAINTENANCE each reported `requestable=false`; AVAILABLE restored `requestable=true`.

The authoritative guard applies to fully configured V2 vehicles while preserving the legacy FOR_HIRE path. Exact retries are checked before mutable eligibility so a lost response remains recoverable.

## Authorization matrix

| Actor/action | Evidence | Result |
|---|---|---|
| Renter reads own rental | Hosted | PASS |
| Correct owner reads workspace request | Hosted | PASS |
| Renter performs owner approval | Hosted 403/404 | PASS |
| Owner acts through unrelated workspace | Hosted 403/404 | PASS |
| Anonymous reads rentals | Hosted 401 | PASS |
| Owner approve/reject | Hosted | PASS |

## Privacy boundary

**Hosted PASS.** Public discovery contained no exact coordinates, operational location, accuracy, private phone, registration details, rental TransportNeed, pickup, or destination. Authorized rental responses exposed only that rental's snapshots. Signed READY media rendered without exposing storage paths.

## Hosted passenger scenario

**Hosted PASS.** FAMILY_OR_GROUP, six passengers, WITH_DRIVER, long distance and return trip matched the controlled SUV as SUITABLE and requestable. Detail loaded, explicit Mikocheni pickup and Kariakoo destination were stored, the owner approved, and the renter observed APPROVED.

## Hosted cargo scenario

**Hosted PASS.** MOVING_GOODS with 1,200 kg payload, covered body, WITH_DRIVER and long-distance requirements matched the controlled box truck as SUITABLE. The request stored its snapshots, reached the owner, was rejected through the canonical action, and remained visible to the renter as REJECTED. Volume was intentionally omitted because Suitability V1 correctly treats unverified volume as CANNOT_VERIFY.

## Failure/retry behavior

**Automated + hosted PASS.** Network/detail errors retain safe retry surfaces; action errors use user-facing messages. Stale requestability and overlap conflict returned sanitized responses without SQL/PostgREST/stack leakage. Retry IDs prevent duplicate submission.

## Navigation/state restoration

**Automated + inspection PASS.** Route extras carry context only for the selected listing and do not introduce global mutable state. Explore/detail/booking back navigation retains the pushed-page predecessor. Booking form state remains local through validation/submission failures.

## Responsive/accessibility checks

**Automated PASS.** The full Flutter suite includes 320 px, 390 px, 600 px, large-text, semantics, long-content, empty/error, and reachability coverage. The carried TransportNeed form and requestability states passed widget coverage. No analyzer or test overflow failure occurred. This is not claimed as a new physical-device accessibility certification.

## Performance/request discipline

**Inspection PASS.** Matching remains one server-side PostGIS + Suitability RPC and is not reimplemented client-side. Detail makes one detail request plus one current public eligibility/discovery read through an auto-disposed provider. Rental mutation retains a single idempotent request. No rebuild-triggered matching loop or polling was added.

## Backend regression

**Automated PASS.** From `supabase/`:

```text
npm test
83 passed, 0 failed, 0 skipped, exit 0
```

**Hosted PASS.** `npm run certify:phase1` completed 61 checks, 0 failures, exit 0.

Migration ledger is coherent through:

- `20260922000000_rental_requestability_guard.sql`
- `20260922010000_v2_vehicle_media_serialization.sql`

No Edge Function code changed; hosted `garilink-api` remains ACTIVE at version 16.

## Flutter regression

**Automated PASS.** From `mobile_flutter/`:

```text
dart format --set-exit-if-changed lib test
110 files formatted, 0 changed, exit 0

flutter analyze --no-pub
No issues found, exit 0

flutter test --no-pub
105 passed, 0 failed, exit 0
```

## Sprint 1.1 regression

**Automated + hosted PASS.** TransportNeed validation, schema versioning, nested cargo, serializer behavior, immutable snapshots, and legacy-compatible rental creation remain operational.

## Sprint 1.2 regression

**Automated + hosted PASS.** Location validation and separate pickup/destination snapshots passed; public discovery retained the exact-coordinate privacy boundary.

## Sprint 1.3 regression

**Automated + hosted PASS.** PostGIS bounded nearby matching, safe public distances, configured-radius behavior, and location privacy remained operational. No spatial migration/index was changed.

## Sprint 1.4 regression

**Automated + hosted PASS.** Suitability V1, deterministic explanations, passenger/payload/covered-body/driver/long-distance matching, availability/requestability, matching endpoint, and rental-only discovery remained operational.

## Controlled fixture cleanup

**Hosted PASS.** The controlled SUV and truck were restored to their prior capability/availability configuration and paused. They are absent from public discovery. Active certification rentals were cancelled; rejected historical requests were retained. Controlled accounts and approved project media were preserved. Supabase was not reset.

## Production changes

- Applied `20260922000000_rental_requestability_guard.sql` to `yvcdkmsfuakjflmuatgz`.
- Applied `20260922010000_v2_vehicle_media_serialization.sql` to `yvcdkmsfuakjflmuatgz`.
- No Edge Function deployment was required.
- No NestJS deployment occurred.
- No migration history repair/reset occurred.

## Deferred scope

Road/route distance, route geometry, directions, ETA/traffic, pricing and distance pricing, payment/payout/commission, subscriptions, chat/contact handoff, live/background tracking, ML/LLM recommendations, numerical suitability scores, and large visual redesign remain deferred.

## Known non-blocking issues

- Cargo volume remains intentionally CANNOT_VERIFY in Suitability V1; Phase 1 does not infer volume capacity from body dimensions.
- The separate local PostgreSQL stand-in at `127.0.0.1:5433` was offline, so its optional SQL harness was not used. The final database behavior was instead exercised against the linked hosted project, and all required repository commands passed.
- Physical-device navigation/accessibility observation was not repeated; automated responsive/semantic tests and hosted API journeys are the recorded evidence.

## Definition of done

All mandatory Sprint 1.5 and Phase 1 gates are backed by automated, hosted, or explicitly identified inspection evidence. No required gate is inferred from a unit test alone, and no Phase 2 feature was introduced.

## Sprint verdict

SPRINT 1.5: COMPLETE

## Phase 1 verdict

PHASE 1: COMPLETE
