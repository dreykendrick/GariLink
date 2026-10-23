# Sprint 3.7 — local review lifecycle implementation

2026-10-21. **INCOMPLETE / NOT runtime-certified. Production collection and enforcement remain disabled.**

## 1. Preservation and Git safety

Continued the existing uncommitted Sprint 3.6 work in `GariLink-person-identity`, branch `codex/person-identity-lifecycle`, based on `bc908897d89d55017d27c16e66e478c5b37e71fe`. The other worktrees remain `GariLink-main` / `codex/renter-owner-journeys` and `GariLink-ci-kyc-certification` / `codex/database-certification`. No reset, clean, merge, rebase, commit, push, PR change, hosted connection, deployment or Windows/Docker repair performed.

Sprint 3.6 remains present. Its prior test results are historical evidence, not current Sprint 3.7 regression certification.

## 2. Implemented case/review slice

New forward-only migration `20261021000000_person_identity_review_lifecycle.sql` brings the canonical chain to 36 migrations. It adds private, RLS-enabled validation receipts and immutable operation replay records. No grants on those tables to clients or service_role.

Applicant `garilink_identity_submit` derives the confirmed active session, locks the actor and case, checks ownership, expected revision/policy, latest validated evidence and matching trusted receipt, then atomically records PENDING_REVIEW, revision, audit and exact retry response. Conflicting retries fail. Missing scanner provenance fails closed.

Database-owner-only `identity_assign` assigns/revokes a specific time-limited case reviewer; subject overlap is denied. This is a database administrative primitive, NOT a production administrative service: the administrator ID is supplied by the trusted DB owner, not a browser. No ordinary owner/fleet role, editable metadata or service-role grant conveys that authority. A separately authenticated and audited administrative orchestration boundary is still required.

`garilink_identity_decide` requires an ordinary active reviewer session, scoped unrevoked/unexpired assignment, distinct applicant, pending state, matching revision/policy and validated latest evidence. It serializes on the case, appends immutable approval/rejection plus audit, and records exact idempotency payload/response. Allowed reason codes are technical workflow codes, not legal document policy. Replay rechecks current reviewer authority. No reviewer document bytes, private path or applicant ID is returned.

Reviewer qualification is now separate from case assignment. A private append-only authority-event ledger records idempotent database-owner grants and revocations. Workspace roles, JWT metadata, service-role possession and self-assertion cannot qualify a reviewer. Both assignment and decision recheck the latest unexpired authority event, so revocation or expiry immediately blocks new decisions even when an older case assignment remains present. This is still a database administrative primitive; a production administrator identity/orchestration service remains outstanding.

No Edge route was added for these new operations; disposable SQL exercises the RPC contracts directly. No backend deployment occurred.

## 3. Evidence reservation/upload/finalization

**2026-10-23 state correction:** the following NOT IMPLEMENTED description records the earlier checkpoint. An uncommitted evidence-transport migration, opt-in transport routes, processor and synthetic tests now exist locally. They are not runtime-certified or production-enabled. See `GARILINK_PRODUCT_RESUMPTION_2026_10_23.md` for current inventory, processor hardening and definitive regression results; do not duplicate this existing slice or treat the earlier 36-migration count as current.

**NOT IMPLEMENTED or certified.** Existing restrictive Storage collection policy remains intact. No publicly writable bucket, upload API, signed upload URL, client-selected object path, service key in Flutter or scanner bypass added.

The new receipt is a contract for a future trusted validator, not proof that bytes were scanned. It binds document ID, SHA-256, size and opaque path; metadata alone cannot establish actual content safety. No receipt-writing RPC is exposed. The synthetic SQL suite explicitly seeds metadata and a receipt as database administrator with `SYNTHETIC_SQL_FIXTURE_NOT_A_SCAN`; it neither uploads real bytes nor pretends to be a malware scan.

Outstanding: actor/case/version-bound expiring reservation, actual Storage transfer, real byte signature/hash validation, scanner failure/unsafe-content handling, immutable replacement binding, short-lived scoped reviewer content access. Until these exist and are certified, no genuine document submission path is available.

## 4. Expiry, revocation and resubmission

Trusted database-owner-only revocation appends a REVOKED decision, increments case revision and audits the administrator; approval history remains immutable. Requested-period eligibility denies immediately after revocation.

Forward repair retains the preparation function signature and actor lock, materializing expired APPROVED cases and an expiry audit before checking active-case uniqueness. This addresses the prior projected-expiry resubmission blocker without rewriting history. Defensive repair targets abort if the expected preparation definition is missing.

Safe summary now advertises new-draft resubmission for rejected/expired/revoked states. New cases retain old case/decision versions. These transitions and expiry repair have not executed against PostgreSQL yet.

## 5. Flutter applicant experience

Existing production-disabled debug page and account-keyed state preserved. It now consumes the server resubmission flag, offers a new draft only when permitted by the server, and retains the same UUID across a failed retry while using a new UUID for a different case. Status refresh remains server-backed. Added narrow-screen/200% text resubmission widget regression.

The full Provide Evidence → Review Submission → Submit journey is **not implemented**, because accepted upload is unavailable. No fake upload success, approval or production KYC gate is shown. Existing renter/owner flows were not redesigned. Compilation/widget execution of these changes remains uncertified due tooling restrictions below.

## 6. Eligibility

Private `identity_eligibility(subject, case, action_start, action_end)` checks subject, identity scope, server time/requested period, state projection and validated latest evidence. It distinguishes valid identity from inactive policy: `identityValid` may be true but `eligible` always remains false with POLICY_NOT_ACTIVATED. No rental/publication mutation consumes or activates it. Contact, tenancy, ownership, driver qualifications, availability, pricing and entitlements remain independent.

## 7. Actual local checks

- Full `npm test`: **127 reported tests, 120 passed, 7 failed, 0 skipped, exit 1**. Failures involve child-process execution: script entry-point, fixture role/parser, migration parser, media parser, synthetic PNG checker and composition subprocess. A minimal direct Node child launch reports `spawn EPERM`. No assertion was removed or weakened. A module-load failure prevents its contained signature tests from registering; counts are not equivalent to a successful full suite.
- Focused run with repository's existing in-process test-isolation mode: **6 passed, 0 failed, exit 0** (three static lifecycle contracts and three mocked preparation API tests). These do not certify SQL authorization.
- Direct signature AST audit: **36 migrations, errors []**.
- Direct fixture-role AST audit: **errors []**, including new suite.
- Direct combined SQL AST composition: **700 statements parsed**.
- Direct PL/pgSQL parser: **5 new PL/pgSQL function definitions parsed**. Parsing is not execution or grant certification; dynamic repair bodies still require actual migration replay.
- Dart formatter: **135 files, 0 changed, exit 0** on final verification.
- `flutter analyze --no-pub`: **exit 1**, failed to launch Dart analysis server with `CreateFile failed 5 / Access is denied`. Specific SDK/package/telemetry-cache write permissions were requested and granted; subprocess launch remains blocked. No Windows changes made.
- Full `flutter test --no-pub --reporter expanded`: launched but produced no definitive suite result; interrupted after subprocess-launch access failures were established, process exit 1. **NOT CERTIFIED**. No product test deadlock was proven. Do not carry forward Sprint 3.6's 213-pass result as a current pass.
- Approved local database probe `127.0.0.1:5433`: **no response**. No database was reset, repurposed or modified.
- Runtime SQL, concurrency, real Auth and real Storage lifecycle tests: **NOT EXECUTED**. No CI triggered without separate authorization.
- Final `git diff --check`: exit 0. Scoped credential-pattern scan of new migration/tests and changed Dart implementation: 0 matches. Staged diff empty; no commit or push.

## 8. Prepared disposable evidence and cleanup

Added `identity-lifecycle-assertions.sql` after the unchanged seven suites, closed suite and preparation suite. Prepared cases cover missing evidence/receipt denial, submission and replay, stale retry, self/unassigned review denial, scoped approval/replay, conflicting decision, requested-period expiry, wrong subject, trusted revocation, new draft and retained decision history. These are test definitions, not passed cases.

All synthetic metadata, Auth stand-ins and immutable history are inside the established disposable BEGIN/ROLLBACK harness. Cleanup is rollback or destruction of the disposable service, never deletion of production audit history or relaxation of foreign keys. Real Auth account deletion with retained cases still requires an approved retention/deletion strategy. Existing 65 HTTP closed-foundation assertions and seller-management exclusion disclosure remain unchanged; they do not cover new lifecycle RPCs.

## 9. Files changed this sprint

- New migration above.
- New `supabase/tests/identity-lifecycle-assertions.sql`.
- New `supabase/tests/identity-lifecycle-contract.test.mjs` (explicitly static only).
- `supabase/tests/run-ci-sql.mjs`: appended separate lifecycle stage.
- `supabase/tests/audit-fixture-roles.py`: included new suite.
- `mobile_flutter/lib/features/verification/data/identity_repository.dart`: safe resubmission field.
- `mobile_flutter/lib/features/verification/presentation/identity_preparation_page.dart`: new-draft retry handling and accurate copy.
- `mobile_flutter/test/identity_preparation_test.dart`: resubmission test.
- This report. Existing Sprint 3.6 files remain uncommitted and preserved.

## 10. Compliance/security blockers

No approved national document types, retention durations, government integrations or legal rules invented. Production collection/activation prohibited until evidence requirements, actual scanner/content validation, authorized reviewer byte access, retention/deletion/legal hold, subject rights and account deletion have been approved and tested.

Remaining security certification gaps include two-session competing create/submit/decision/replacement, expired/revoked assignment, all rejection/expiry branches, receipt/object replacement, wrong bytes/hash/MIME/size, scanner unavailability, private sign/read/delete, account switch and actual 36-migration replay. Static guards are not evidence that these attacks are denied at runtime.

## 11. Next certification / integration

After separately authorized CI execution, run 36 migrations, all original seven suites plus closed/preparation/lifecycle, and preserve old 65 HTTP assertions. Add actual synthetic-byte validation and ordinary Auth-session lifecycle/concurrency coverage before calling this operational. Do not expose an accepted upload endpoint merely to make the demo work.

Retain both branches. A reviewed integration must apply only identity files and deliberate router/Profile additions over the dirty product branch, preserving booking continuation, verification UI and all product tests. Run the combined product regression; the isolated identity branch does not claim to include the dirty product branch's 238-test suite.

## 12. Expansion readiness / verdict

Vehicle/driver verification: **NOT READY** until the person evidence/reviewer lifecycle is implemented and runtime-certified. Subscription architecture planning can remain independent and non-implementing, but this pass does not satisfy the KYC completion gate and authorizes no billing work.

Largest completed code slice this pass: guarded submission/review/revocation contracts and resubmission UI, with closed accepted evidence boundary. A complete demonstrable applicant-to-reviewer lifecycle is not yet available.

SPRINT 3.7: INCOMPLETE

## 13. 2026-10-23 continuation: reviewer authority boundary

This continuation closes the reviewer self-enrolment flaw found during the resumed audit. Reviewer eligibility is now controlled by an immutable private authority-event ledger. Only the database owner can append an idempotent grant or revocation; ordinary clients and `service_role` cannot call the authority function or access the ledger directly. Assignment requires an active, unexpired grant, and a decision rechecks the grant so a later revocation or expiry takes effect immediately.

The change does not add evidence collection, expose Storage, activate an eligibility consumer, or alter production enforcement. Existing renter/owner work, investor snapshots and the open database-certification pull request were left unchanged.

Final checks for this continuation:

- Supabase test suite: **130 passed, 0 failed** (`npm test`, executed outside the restricted process sandbox after the sandbox run showed child-process `EPERM`).
- Flutter test suite: **214 passed, 0 failed** (`flutter test --no-pub`).
- Flutter analyzer: **No issues found** (`flutter analyze --no-pub`).
- Migration signature audit: **36 migrations, errors []**.
- Fixture-role audit: **errors []**.
- Focused identity contract/API tests: **7 passed, 0 failed**.
- PostgreSQL/Auth/Storage runtime lifecycle and concurrency certification: **NOT EXECUTED**; no authorized disposable database was available in this continuation.

Sprint 3.7 therefore remains **INCOMPLETE**. The next coherent product-security slice is a private evidence transport and validation path: actor/case/version-bound reservation, real byte signature/hash/MIME/size checks, fail-closed malware scanning, immutable finalization, and short-lived reviewer access. It must then be exercised with ordinary Auth sessions and concurrency cases in a disposable environment before production collection or enforcement can be considered.
