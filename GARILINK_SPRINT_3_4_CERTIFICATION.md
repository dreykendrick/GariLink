# GariLink Sprint 3.4 Certification

## Status

COMPLETE

## Implementation

- Selected-vehicle summary propagated from Vehicle Detail.
- Matched TransportNeed preserved and no longer re-entered.
- Dates precede location and need review.
- Pickup client validation added; manual entry remains first-class.
- Estimate state guidance and returned component breakdown improved.
- Estimate invalidation and generation guard retained.
- Review explanation states that owner approval is required and no payment is taken.
- Primary action standardized to “Send rental request.”
- Existing atomic creation, server revalidation, current-policy estimate, and idempotency retained.
- Request-sent success continues to invalidate Trips and navigate to the Trips flow.

## Automated UI evidence

PASS — matched context, direct entry, request terminology, no-payment/owner-review explanation, and 320/390/600 logical pixels at 200% text.

## Hosted evidence

- Phase 1 request integration: 61 passed, 0 failed.
- Sprint 2.1 pricing: 36 passed, 0 failed.
- Sprint 2.2 provider-independent routing: 9 passed, 0 failed; live Google routing was not claimed.
- Sprint 2.3 estimates and snapshots: 46 passed, 0 failed.
- Sprint 2.4 resilience: 68 passed, 0 failed.

These runs executed passenger/cargo requests, configured and unconfigured pricing, route-unavailable submission, AVAILABLE submission, BUSY/UNAVAILABLE/MAINTENANCE and paused rejection, current-policy recalculation, exact idempotent retry, response-loss retry, immutable TransportNeed/pickup/destination/pricing snapshots, authorization/privacy, FOR_SALE exclusion, and cleanup.

## Regression

- Formatter: 116 files clean, exit 0.
- Analyzer: no issues, exit 0.
- Flutter: 136 passed, 0 failed, exit 0.
- Backend/API: 94 passed, 0 failed, 0 skipped, exit 0.
- Sprint 3.1–3.3 presentation/domain regression is included in the complete Flutter suite and hosted Phase 1/2 contracts.

## Database and deployment

None expected. No API, migration, Edge Function, or legacy Nest deployment is required.

## Fixture cleanup

PASS — certification rentals were cancelled, controlled public vehicles were paused, availability and pricing policy were restored, and reusable controlled accounts/media/evidence were retained.

## Known boundary

Google Routes remains provider-independent only because no production API key/billing activation was available. Physical Android smoke testing was not executed without an attached Android target; responsive widget certification is not represented as physical-device evidence.

## Verdict

The complete renter request path, its server authority, degraded pricing states, stale-state rejection, atomic snapshots, idempotency, privacy, responsive behavior, and cleanup are certified.

SPRINT 3.4: COMPLETE
