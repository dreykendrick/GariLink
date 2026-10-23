# Sprint 3.0 — Post-login vehicle review continuation

## 1. Exact defect

Vehicle detail pushes `/booking` with listing presentation/query data and optional discovery selection. Anonymous route protection replaced that destination with `/login`, without remembering the listing. Successful Login also explicitly called `go('/home')`, overriding any prospective router continuation. Cancel/failure could not recover a booking destination because none was tracked.

## 2. Implemented architecture

`BookingContinuation` is an ephemeral, provider-owned plain object. It accepts only an internal `/booking` URI with exactly one valid UUID listingId, stores only that public ID and flow-start time, and consumes once within ten minutes. External/authority URLs, wrong paths, missing/malformed/duplicate IDs fail closed. Repeated redirects cannot extend lifetime. Clock reversal also fails closed. New provider container/process starts empty. No secure storage, preferences, credentials, free text, location, dates, price, workspace, suitability or private booking evidence is stored.

Anonymous booking interception captures the ID and routes to Login. Router alone handles successful login; Login no longer forces Home. Success invalidates the listing-details provider and redirects to `/vehicle-details?listingId=...&review=1`. The public review flag only controls explanatory UI, never authority. Fresh data drives existing availability/pricing/requestability presentation. The user must review current details, explicitly choose Request, enter/review request fields, obtain the existing authoritative estimate and submit themselves. Nothing automatically submits, approves or bypasses backend checks.

The resumed detail has explanatory copy and a Back to Explore control. Busy vehicles remain non-requestable. Missing/deleted/unpublished reads use the existing friendly unavailable/retry state. Normal login still returns Home.

## 3. Files changed in this sprint

- `mobile_flutter/lib/core/navigation/booking_continuation.dart` (new)
- `mobile_flutter/lib/core/navigation/app_router.dart`
- `mobile_flutter/lib/features/authentication/presentation/pages/login_page.dart`
- `mobile_flutter/lib/features/vehicle/presentation/pages/vehicle_details_page.dart`
- `mobile_flutter/test/booking_continuation_test.dart` (new)
- `mobile_flutter/test/owner_rental_operations_test.dart`
- This report.

Earlier uncommitted journey/verification work remains preserved; this list does not claim those earlier edits are new to Sprint 3.0. No booking engine, auth repository/session implementation, migrations/RLS/grants, Edge Functions or hosted services changed.

## 4. Auth/edge-case behavior

| Scenario | Behavior/evidence |
| --- | --- |
| Successful intercepted request | Widget test routes Login → fresh correct vehicle review, not Booking |
| Cancel | Back control clears pending flow; leaving auth to public routes clears; unit + navigation-cancellation test |
| Failed login | Retains bounded flow for retry; failed-then-success widget test |
| Expired continuation/repeated redirects | Unit-tested timeout, no lifetime renewal; successful login falls back Home |
| Existing identity changes/logout | Router auth listener clears pending ID when an existing user changes/disappears; code-reviewed, no new account-switch integration certification |
| Anonymous signs into another legitimate account | Only public ID retained; fresh session/server reads apply, no old account evidence or rental submitted |
| Busy/requestability changed | Widget test fresh BUSY result shows Not requestable |
| Deleted/unpublished | Failed read displays Vehicle unavailable/retry, with no raw error; deleted fixture tested; unpublished shares same read-failure path, not a separate hosted test |
| Changed pricing | Fixture supplies fresh TZS 90,000/day; old route presentation is not retained; no real estimate/provider transaction executed |
| Workspace switch | No workspace identity/authority captured; normal workspace authorization remains server-owned; no new switching integration test |
| Back/restart | Explicit Explore fallback; unit cancellation/new-instance tests; physical system-back/app-kill still needs device QA |
| Ordinary login | Widget test still lands Home |

Existing rental-estimate/requestability/session tests remain in full regression. They are not proof of real hosted Auth expiry/refresh, pricing provider or KYC behavior.

## 5. Scope of preserved context

The deliberately conservative first implementation preserves the vehicle, not an entire booking draft. TransportNeed, dates, notes and exact pickup/search coordinates are not carried through login. The renter re-enters/reviews requirements after choosing Request again. No stale suitability claim or estimated price is reconstructed. Richer sanitized transport-intent continuation can be separately scoped later if product testing shows it is necessary; this sprint does not advertise complete draft restoration.

## 6. Tests

15 new continuation tests cover consume-once, six invalid destination forms, bounded duplicate redirects, cancellation/restart, available/busy/deleted results, normal/cancelled login and failed-then-success. Five additional populated owner queue tests cover 320/360/390/430/600 at actual 200% text. Existing keyboard/form/navigation/status tests retained.

- Focused continuation/email/owner suite: 51 passed, exit 0, including Back to Explore presentation assertion.
- Node API suite: 107 passed, 0 failed/skipped, exit 0.
- Final full Flutter suite with stronger stale-cache assertions: 225 passed, 0 failed, exit 0 (1m33s reported runtime). A live old response was retained in the test container, then changed during Login; continuation had to invalidate it and fetch again to show new availability/price or a deleted-vehicle fallback.
- Final formatter: 131 files, 0 changes, exit 0. Final analyzer: no issues, exit 0 (59.1s).

An initial widget test was interrupted after hanging on mocked secure-storage hydration inside fake async; setup was corrected to use tester.runAsync. Initial price expectations failed for non-requestable BUSY presentation and a mislabeled FAILED vehicle fixture; fixed to assert actual busy UI and use AVAILABLE for failed-auth retry. No product security assertion was weakened. Analyzer lint findings were corrected, not suppressed.

## 7. Remaining UX/security gates

Physical keyboard/system-back, account switching/session expiry during form use and App Links remain device/integration gates. A restarted app intentionally has no continuation. Private or rich request drafts are not restored. Auth callbacks still use their separately implemented confirmation/recovery behavior, not this Login-specific return flow. Full SQL/real Auth/Storage/KYC certification is unchanged and incomplete; real document collection stays disabled.

## 8. Git safety

Stayed on `codex/renter-owner-journeys`; no destructive operation, commit, push, merge, build or deployment. Existing generated backend/dist, verification preview and prior reports/logs preserved. Product branch includes unmerged CI history through `65f312c`; do not open a product PR against main from this branch as-is. After authorization, either integrate certified CI separately first and review the product-only diff, or create a clean main-based branch and apply only a reviewed product patch including required existing product changes. Do not perform that integration implicitly or lose dirty work.

## 9. Readiness

This is a safe local vehicle-review continuation foundation, not production Auth certification or automatic booking restoration. Next product sprint: user-tested need/form restoration where safe, plus physical keyboard/back and session-switch scenarios. Continue non-sensitive local development; keep backend verification and deployment as separate approval/certification tracks.
