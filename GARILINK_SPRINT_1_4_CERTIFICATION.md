# GariLink Sprint 1.4 Certification

**Hosted project:** `yvcdkmsfuakjflmuatgz`  
**Status:** COMPLETE — certified 2026-09-22.

## Objective and implementation

Suitability V1 is a deterministic, versioned (`matchingVersion: 1`) PostgreSQL evaluator used by `POST /v2/vehicles/match`. It applies hard requirements only after PostGIS nearby filtering and existing V2 discoverability rules. Primary matched discovery returns confirmed `SUITABLE` vehicles ordered by authoritative unrounded geodesic distance then stable listing ID. Public distances are rounded to 100 metres; equal displayed distances do not necessarily imply an internal distance tie. It deliberately has no match percentage.

**Score decision: SCORE DEFERRED / NOT REQUIRED.**

Deployed migration: `20260918000000_vehicle_suitability_matching.sql`.  
Deployed function: `garilink-api`, including `POST /v2/vehicles/match`.

## Controlled inventory

- Existing controlled passenger vehicle, configured with seven seats, driver, self-drive, and long-distance capability.
- `TEST CERTIFICATION Isuzu N-Series Box Truck`, created through the normal controlled owner draft, approved media, private location, capability configuration, and publication flow. It is explicitly test inventory.

## Hosted evidence

| Scenario | Result | Evidence |
| --- | --- | --- |
| Passenger sufficient | PASS | Seven-seat controlled vehicle returned for six-passenger request. |
| Passenger insufficient | PASS | Hosted evaluator returned `UNSUITABLE` / `INSUFFICIENT_PASSENGER_CAPACITY`. |
| Passenger unknown | PASS | Hosted evaluator returned `CANNOT_VERIFY` / `PASSENGER_CAPACITY_UNKNOWN`. |
| Payload sufficient | PASS | Controlled box truck returned with `PAYLOAD_CAPACITY_OK`. |
| Covered cargo supported | PASS | Controlled box truck returned with `COVERED_CARGO_SUPPORTED`. |
| Invalid input | PASS | Hosted endpoint rejected invalid latitude without SQL leakage. |
| Matched response privacy | PASS | Hosted matched response contained no coordinates, operational location/geography, pickup/destination, or TransportNeed. |
| PostGIS index behavior | PASS | Existing hosted `EXPLAIN ANALYZE` used `gl_vehicles_operational_geog_gist`. |
| Payload boundary/mismatch | PASS | Independent hosted evaluator checks: 2,500 kg requirement against 2,500 kg capability was `SUITABLE` / `PAYLOAD_CAPACITY_OK`; 2,501 kg was `UNSUITABLE` / `INSUFFICIENT_PAYLOAD_CAPACITY`. |
| Covered unsupported/unknown | PASS | Independent hosted evaluator checks: `OPEN` body was `UNSUITABLE` / `COVERED_CARGO_REQUIRED`; missing cargo-body capability was `CANNOT_VERIFY` / `COVERED_CARGO_UNKNOWN`. Primary discovery intentionally excludes the latter. |
| Driver supported/unsupported/unknown filtering | PASS | Previously verified evaluator support/rejection retained. On 2026-09-22, false and absent `with_driver` capabilities both left the controlled truck discoverable through nearby while excluding it from a WITH_DRIVER match. Missing capability is a legitimate published configuration; validation was not weakened. |
| Self-drive supported/unsupported/unknown filtering | PASS | Previously verified `SELF_DRIVE_AVAILABLE` retained. Hosted false and absent `self_drive` cases stayed nearby/discoverable and were excluded from SELF_DRIVE matches. |
| Long-distance supported/unsupported/unknown filtering | PASS | Previously verified `LONG_DISTANCE_SUPPORTED` retained. Hosted false and absent `long_distance` cases stayed nearby/discoverable and were excluded from a long-distance match. |
| Multiple-requirement all-pass | PASS | Hosted evaluator: `MOVING_GOODS`, 500 kg, covered body, `WITH_DRIVER`, long-distance against Box/2,500 kg/driver/long-distance capabilities returned `SUITABLE` with `PAYLOAD_CAPACITY_OK`, `COVERED_CARGO_SUPPORTED`, `DRIVER_AVAILABLE`, and `LONG_DISTANCE_SUPPORTED`. |
| Multiple-requirement one-failure | PASS | The otherwise identical hosted request at 2,600 kg returned `UNSUITABLE`; only `INSUFFICIENT_PAYLOAD_CAPACITY` failed, while covered cargo, driver, and long-distance requirements remained satisfied. |
| Multiple-requirement multi-failure | PASS | Hosted evaluator: 2,600 kg covered/with-driver/long-distance need versus 500 kg, `OPEN`, no-driver, not-long-distance capabilities returned `UNSUITABLE` with all applicable failures: `INSUFFICIENT_PAYLOAD_CAPACITY`, `COVERED_CARGO_REQUIRED`, `DRIVER_REQUIRED_NOT_SUPPORTED`, `LONG_DISTANCE_NOT_SUPPORTED`. |
| Deterministic multi-failure reasons | PASS | The exact unchanged hosted evaluator request was executed three times. Each returned `UNSUITABLE` with the identical ordered reason list: payload, covered-cargo, driver, long-distance. |
| Closer unsuitable / farther suitable | PASS | Hosted canonical owner PATCH explicitly set the closer controlled vehicle's driver capability false. At a derived distance of 0 m it remained discoverable but was excluded from WITH_DRIVER matches; the suitable vehicle at 2,200 m was returned. Original capabilities restored. |
| Multiple suitable ordering | PASS | Two identical hosted match requests returned the same three listing IDs in the same order, at public distances 0, 2,200, 2,200 m. Order: `5cf8e621-96e9-4e6e-bc99-3ed5d0d4afc7`, `2971fec1-fe6f-4970-92bc-a7a4a5de7028`, `62bbc6e7-5835-42f1-95e4-676ec69a69d6`. Deployed migration specifies unrounded distance ASC, listing ID ASC. No score introduced. |
| Suitable AVAILABLE/requestability true | PASS | Actual matched truck response: status SUITABLE, operationalAvailability AVAILABLE, eligibility.requestable true. |
| Suitable BUSY/requestability false | PASS | Canonical controlled owner PATCH to BUSY followed by actual matcher response: status SUITABLE, operationalAvailability BUSY, eligibility.requestable false. Original AVAILABLE state restored. |
| Hosted no-nearby | PASS | Valid need and remote search origin returned zero nearby candidates and zero matches at 10 km. No private fixture coordinates recorded. |
| Hosted nearby but all unsuitable | PASS | All three existing controlled nearby fixtures temporarily configured with `with_driver:false`. Nearby returned all three with explicit false capability; WITH_DRIVER matching returned zero. All original capabilities restored afterward. |
| Explore no-nearby/no-suitable | PASS | Six-test Flutter widget run verifies distinct messages using the real repository and panel with controlled API responses. Empty matching now probes the existing nearby endpoint with identical origin/radius and limit 1. Hosted evidence above separately verifies both backend conditions; widget evidence is not represented as hosted UI evidence. |
| Radius expansion | PASS | Hosted cargo request: zero matches at 500 m, truck returned at 25,000 m with identical TransportNeed/SearchLocation. Widget test verifies only radius changes from 10,000 to 25,000, matcher reruns, and results replace the empty state. |
| Failure and retry preservation | PASS | Widget test forces failure after expanding to 25 km; retry sends identical TransportNeed, SearchLocation, and radius and displays success. Raw error text remains hidden. |
| Loading, success, uncertain result handling | PASS | Widget tests verify progress then success; CANNOT_VERIFY cannot appear as a confirmed match, and unknown reason codes get safe human-readable copy. |
| Availability UI and reason copy | PASS | Widget tests verify AVAILABLE/requestable versus BUSY/not-requestable copy and human-readable reasons with no raw-code leakage. |
| Final hosted privacy / rental-only | PASS | Recursive inspection of actual final matcher payload rejected keys for coordinates, geography, accuracy, private addresses/notes, phone, registration, and pickup/destination snapshots. All three returned records were FOR_HIRE. |
| Certification-fixture cleanup | PASS | All three existing controlled evaluation fixtures paused through normal owner publication API and verified absent from public V2 discovery. Temporary capabilities/availability restored. One older approved evaluation rental cancelled through its controlled renter's canonical cancellation API. Accounts, media, and evidence preserved. |

`CANNOT_VERIFY` is intentionally excluded from primary renter matches. It is nevertheless proven at the server-authoritative evaluator and remains a future-compatible result status.

## Flutter and backend regression

| Check | Result |
| --- | --- |
| Backend `npm test` | 83 passed, 0 failed, 0 skipped; exit 0; rerun after final application fixes |
| `dart format --set-exit-if-changed lib test` | 109 files, 0 changed; exit 0 |
| `flutter analyze --no-pub` | no issues; exit 0; 155.4 seconds |
| `flutter test --no-pub` | 103 passed, 0 failed, 0 skipped; definitive final result and exit 0; 43 seconds |

Explore now takes a mutable TransportNeed plus SearchLocation, calls the matching endpoint, renders translated reason copy, preserves its requirements during a radius expansion, and does not expose raw reason codes or private coordinates.

## Deferred scope

Road/route distance, ETA, route geometry, rental price estimation, subscriptions, payments, contact handoff, and live tracking remain out of scope.

## Verdict

Hosted gates, required Flutter state coverage, fixture cleanup, and full regression after the certification fixes are complete. Hosted evidence and widget evidence are identified separately above. No physical-device UI certification or new APK build is claimed by this pass.

## 2026-09-22 completion evidence and fixes

Hosted execution: `node scripts/certify_matching_remaining.mjs` exited 0, covering remaining ranking, availability, capability branches, geography, radius, and privacy gates. `node scripts/close_matching_fixtures.mjs` exited 0 after the final all-hard-fail case and cleanup. These scripts use existing controlled accounts and canonical owner/renter API flows; administrative credentials are never printed. No fixture was recreated.

Defects corrected in Flutter: empty matched discovery previously conflated no-nearby with no-suitable; matched cards omitted availability/requestability; a fast failed Future could complete before FutureBuilder subscribed. Fixes use the existing nearby endpoint only when matching is empty, display authoritative availability, filter uncertain matches defensively, and observe early failures while retaining the retry UI. Selecting a locality-only origin now also clears stale matched results.

New widget coverage: `test/matched_discovery_states_test.dart`, six tests, all passed (exit 0). Uses the real repository and NearbyDiscoveryPanel with a controlled ApiClient. It covers loading, success, both empty states, CANNOT_VERIFY, AVAILABLE/BUSY, expansion, error/retry, state preservation, readable reasons, and unknown-code fallback.

Cleanup IDs: vehicles `4c1849d4-a825-42b2-8211-97fd8bb6451c`, `9bff59fc-5f24-473d-8338-131ecfc2d045`, and `4232f9ca-d05d-4e2b-a975-c3c4b71b2728` are paused. Rental `ad715a55-901b-4509-a9ee-99abe9a9c5b5` is CANCELLED. The other 18 reviewed evaluation rentals were already CANCELLED. No database, media, account, or migration records were deleted. No schema changes or Edge deployment were required; Flutter fixes require a subsequent app build to reach previously installed APKs.

The initial cleanup diagnostic encountered a protected-table 403 and then a wrong-method 404 in the verification script. The script was corrected to use authorized owner rental reads and the documented PATCH cancellation route. These were tooling mistakes, not product defects or permission bypasses.

Regression provenance: the prior 83/97 unchanged-build baseline was superseded because this pass fixed application defects. The final full suites returned 83 backend / 103 Flutter, zero failures. The pre-existing hit-target warning at `test/transport_need_test.dart:120` remains nonfatal; the test passes. No runtime functionality was weakened to hide a failure. The new six-test suite passed independently and within the full suite.

Changed files in this closeout: this certification record; `mobile_flutter/lib/features/explore/domain/vehicle_suitability.dart`; `mobile_flutter/lib/features/explore/data/repositories/matched_discovery_repository.dart`; `mobile_flutter/lib/features/explore/presentation/pages/explore_page.dart`; `mobile_flutter/test/matched_discovery_states_test.dart`; `supabase/scripts/certify_matching_remaining.mjs`; `supabase/scripts/close_matching_fixtures.mjs`. No migration, backend application code, or Edge Function version changed. The hosted mutations were confined to controlled evaluation account credentials, temporary fixture capability/availability changes (restored), cancellation of the identified evaluation rental, and pausing the three listed evaluation vehicles. Credentials and sessions were never printed.

SPRINT 1.4: COMPLETE
