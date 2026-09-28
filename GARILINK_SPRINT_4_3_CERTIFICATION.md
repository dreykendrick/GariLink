# GariLink Sprint 4.3 Certification

## Scope and implementation

Sprint 4.3 adapts the existing authoritative rental lifecycle into an owner/fleet operations experience. It adds a centralized owner lifecycle presentation, a selected-workspace queue, deterministic grouping, snapshot-first detail hierarchy, explicit historical estimate copy, friendly conflict recovery, mutation locking, and targeted provider invalidation. It does not change the schema or deployed API.

## Automated evidence

- Backend/API: 94 passed, 0 failed, 0 skipped, exit 0.
- Owner rental focused Flutter tests: 14 passed, 0 failed, exit 0.
- Focused renter/TransportNeed regression: 25 passed, 0 failed, exit 0.
- Formatter: 123 files clean, exit 0.
- Analyzer: no issues, exit 0.
- Full Flutter suite: 159 passed, 0 failed, exit 0 (145-entry baseline plus 14 owner-operations tests).
- Responsive automated coverage: request inbox at 320/390/600 px, owner detail at narrow width with enlarged text, and inbox at 200% text.
- Deterministic queue-order, owner conflict copy, and stale open-detail workspace protection are directly tested.

## Hosted certification — `yvcdkmsfuakjflmuatgz`

The established Phase 1 integration harness authenticated the controlled renter and owner through the normal API and executed 70 hosted checks with 0 failures. Evidence included:

- controlled account authentication, owner workspace and inventory reads;
- renter request creation and owner queue visibility;
- exact TransportNeed, pickup, destination, and estimate snapshot parity;
- renter and unrelated-workspace owner-action denial;
- two pending overlapping requests, first approval success, second approval conflict with sanitized HTTP 409;
- invalid transition rejection;
- `APPROVED → READY_FOR_PICKUP → ACTIVE → COMPLETED`, with renter visibility after every refresh;
- rejection and renter-side cancellation with terminal visibility;
- immutable snapshots after lifecycle completion;
- AVAILABLE/BUSY/UNAVAILABLE/MAINTENANCE eligibility and requestability;
- `FOR_SALE` exclusion, public payload privacy, and signed media rendering;
- pause/disappear and republish/reappear without deleting rental history;
- anonymous protected-rental rejection.

The first run exposed an ordering defect in the certification harness: it attempted to create the competing request after approval, when Availability Policy V1 correctly blocks new requests. The harness now creates both pending requests before committing either. No product, schema, or hosted API change was required.

## Hosted scenario matrix

| Area | Executed evidence | Result |
|---|---|---|
| Create and owner visibility | Normal renter create; selected owner queue read | PASS |
| Snapshot parity | Need, pickup, destination and pricing compared | PASS |
| Accept and renter parity | Owner action then renter refresh | PASS |
| Ready/start/complete | Official actions and renter refresh at each state | PASS |
| Conflict | Overlapping pending pair; second approval rejected | PASS |
| Reject | Owner reason and renter terminal state | PASS |
| Cancel | Renter action and owner-compatible terminal state | PASS |
| Invalid transition | Approved-to-complete rejected safely | PASS |
| Snapshot immutability | Beginning/end historical data compared | PASS |
| Requestability | All four availability states and committed guard | PASS |
| Authorization | Anonymous, renter-owner-action, unrelated workspace | PASS |
| Privacy/media | Public payload scan and signed image fetch | PASS |
| Publication/history | Pause/republish; rentals retained | PASS |
| Cleanup | Open requests cancelled; vehicles paused | PASS |

## Security and operational boundaries

No migration was created. No Edge Function was changed or deployed. Existing RLS, grants, signed Storage URLs, role checks, lifecycle RPCs, and conflict constraint remain authoritative. Contact exposure was not expanded. No payment, subscription, maps, tracking, realtime, or new fleet domain was added.

## Fixture disposition

The controlled accounts, media, and historical terminal evidence were retained for team testing. All open certification requests were cancelled, no ACTIVE certification rental remains, and the two controlled vehicles were paused after the run.

## Remaining external validation

Physical-device TalkBack, touch ergonomics, and real intermittent-radio lost-response behavior remain device/network validation gates. They do not replace the automated large-text, semantics, sanitized-error, and authoritative-refresh evidence above.

## Verdict

All implementation, regression, hosted-certification, and cleanup gates passed.

SPRINT 4.3: COMPLETE

