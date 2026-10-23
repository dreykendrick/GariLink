# Main product resumption — 2026-10-23

## Baseline and preservation

| Location | Actual state |
| --- | --- |
| `GariLink-main`, `codex/renter-owner-journeys`, `65f312cf62fb7a366b2c056e2d05c5ea07761e1e` | Dirty product work: booking continuation, login/booking/discovery/owner improvements, verification presentation, approved four Home JPEGs. Also unrelated generated backend/dist changes. Preserved untouched. |
| `GariLink-person-identity`, `codex/person-identity-lifecycle`, `bc908897d89d55017d27c16e66e478c5b37e71fe` | Existing uncommitted preparation, review lifecycle, reviewer authority, and evidence transport. Active work location; not merged into product. |
| `GariLink-ci-kyc-certification`, `codex/database-certification`, `bc908897d89d55017d27c16e66e478c5b37e71fe` | Separate certification baseline. Remote PR #1 remains OPEN/unmerged at this SHA. |
| `GariLink-investor-demo-2026-10-21` | Non-worktree isolated source snapshot, ZIP and readiness records. Preserved. |
| `GariLink-investor-emergency-2026-10-21` | Non-worktree isolated emergency source and APK artifacts; remote branch head `88afb3ba256a28a9263ec5aa6cf18c8d2d426018`. Contains explicit local simulation adapter; NOT a production authentication implementation. Not imported. |

Remote branch inventory read through authenticated GitHub connector: main `f7b1ede004df07bf5aaad4e836197c74333a34ff`, database-certification `bc90889…`, investor emergency `88afb3b…`. Renter-owner and person-identity branches are local only in the returned remote inventory. No remote writes performed.

## Existing Sprint 3.7 progress discovered

The older lifecycle report does not describe all currently present code. The untracked `20261023000000_identity_evidence_transport.sql` already adds closed-by-default collection control, versioned evidence policy, reservations, private inspections/finalization/access ledgers, trusted finalization and reviewer access contracts. Handler/index already contain opt-in reservation and signed reviewer-access routes. Processor and evidence contract/SQL tests also already exist. Do not recreate these foundations.

Preparation and review migrations already contain actor-derived own cases/status, revision/idempotency checks, immutable review/audit, separate reviewer qualification/assignment, decision/revocation and expiry/resubmission handling. These descriptions are code findings, NOT runtime certification.

## This continuation's implementation

Changed only the existing evidence processor and its tests (plus documentation):

- Enforce an actual Promise deadline, rather than relying on an abort-cooperative scanner. A never-settling provider now rejects with SCANNER_TIMEOUT.
- Abort the provider on deadline and clear timers on settlement.
- Reject invalid/non-finite/nonpositive/excessive deadlines.
- Snapshot caller-owned bytes, and give the scanner its own copy so caller/provider mutations cannot change the subsequently attested digest.
- Add three regressions for ignored cancellation, byte mutation isolation and invalid deadlines. Synthetic signature bytes only; no real documents or production scanner claims.

No migration, function privilege, RLS, public collection gate, booking gate, or product navigation change made in this continuation.

## Certification and boundaries

- Restricted `npm test`: 134 passed / 7 failed, exit 1. Child-process sandbox failures; not hidden.
- Same full command with approved normal local process execution: **143 passed, 0 failed, 0 skipped, exit 0**.
- Direct signature audit: **37 migrations, errors []**. This is static compatibility only.
- Dart formatter: **135 files, 0 changed, exit 0**.
- Flutter analyzer: **No issues found**.
- Full `flutter test --no-pub --reporter expanded`: **214 passed, 0 failed, process exit 0**, definitive completion. This isolated identity baseline is not the separate dirty product suite or the investor preview suite.
- `git diff --check`: clean.
- Approved PostgreSQL probe: `127.0.0.1:5433 - no response`. Supabase CLI is available; Docker command/service not found in this inspection. No Windows changes or database reset attempted.
- Actual migration replay, RLS/Auth/Storage evidence lifecycle and two-session concurrency: **NOT CERTIFIED**. Existing harness requires an explicitly disposable CI environment. No new CI execution is authorized by this brief; none triggered.

## Remaining security/compliance blockers

The processor is an unwired trusted primitive, not an operational production scanning service. Signature sniffing is not full document parsing or malware certification. A qualified scanner, trusted worker identity/orchestration, immutable object-version binding and actual Storage-byte ingestion must be connected and tested. Signed upload lifetime versus database reservation expiry must be proven with real Storage, not inferred from response expiry. Reviewer access must be exercised with ordinary sessions and revoked/expired assignments. Full applicant upload/finalize/submit UI remains absent; existing Flutter page intentionally rejects collection-enabled responses and shows server preparation status only.

Production administrator authentication/orchestration, policy approval, retention/deletion/legal hold and subject/account deletion controls remain required. No national document rules or retention periods assumed. Real collection and protected-action enforcement remain OFF.

## Safe integration / next task

Retain both dirty branches. Review an identity-only integration onto the renter-owner product work, manually preserving booking continuation and router/Profile changes; do not merge the emergency preview adapter. Keep identity, driver qualification, workspace/vehicle authority and subscription eligibility separate. Never auto-submit a booking after verification: recheck current eligibility, pricing and availability, then require renter confirmation.

Next coherent task: connect a disposable-only trusted evidence validation worker with actual synthetic Storage bytes, then execute reservation/expiry/replacement/finalization/submission/review/revocation and concurrent creation/decisions with ordinary Auth sessions. A separately reviewed Git/CI batch is required before remote execution. Sprint 3.8 certification is not yet GO; production identity collection remains NO-GO.

SPRINT 3.7: INCOMPLETE
