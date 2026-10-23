# Sprint 3.7B — evidence processing continuation

2026-10-23. **PARTIAL IMPLEMENTATION; NOT RUNTIME-CERTIFIED. Collection/enforcement remain disabled.**

## 1. Baseline

`GariLink-person-identity`, local `codex/person-identity-lifecycle`, HEAD `bc908897d89d55017d27c16e66e478c5b37e71fe`. Existing uncommitted preparation, lifecycle, transport, reviewer authority and Flutter work retained. Actual chain already has 37 migrations, not the brief's older 36 count. No commit/push/deploy/reset. Original dirty renter/owner product, approved photography, booking continuation and investor snapshots untouched.

## 2. Reused architecture — implemented locally

Existing private cases/documents, versioned requirements, immutable audit/decisions, reviewer authority events/assignments, validation receipts, inspection/finalization/access events. No competing identity tables added this pass. Database-owner-only receipt/inspection powers remain closed to anonymous/authenticated/service-role callers. Database ownership remains a privileged trust boundary, not proof that actual scanning occurred.

## 3. Migration/API changes

Corrected the already uncommitted `20261023000000_identity_evidence_transport.sql`; no additional migration or public API added. Null request/revision rejection, expired/non-reserved retry denial, consistent case-before-document finalization locks and pending-only/non-applicant review access added. No applied/hosted migration was edited.

Removed assumed one-day retention from reservation. Policy now requires explicit trusted retention configuration before approval. Default policy remains unapproved and collection control false. SQL-only fixtures use explicitly synthetic durations, never production policy values.

## 4. Reservation/upload — incomplete operationally

Existing actor-derived reservation binds opaque path, version, declared policy, own case and revision, exact retry and expiry. Existing opt-in API signs a private upload with upsert disabled. Ordinary Storage policy remains closed. Actual Supabase signed-upload validity/reuse, Storage ownership for admin-signed upload, and enforcement of the shorter database reservation lifetime are NOT certified. A database expiry field alone does not expire a previously issued Storage token. Do not enable collection on this basis.

## 5. Actual bytes — local orchestration implemented/tested

Added `identity_evidence_worker.ts`: trusted reservation lookup under a transaction adapter; private bucket/path/subject/version checks; size bound before parsing; required full-parser interface; signature/hash and required scanner inspection; reread immutable version and compare exact bytes; reservation expiry recheck; transaction finalization callback. Processor uses private byte copies so caller/parser/scanner mutation cannot alter the attested digest. Worker logs no bytes/paths/subjects/attestations.

No real Storage or DB transaction adapter is installed. Contract requires immutable versions, rollback on callback error and server-side finalization rechecks; these are not guarantees supplied by the in-memory tests. A second read cannot alone prevent an external overwrite after that read. Deployment must use immutable/version-pinned objects and an appropriately privileged, narrowly scoped worker. Timeout during database commit also requires adapter-level cancellation/idempotent outcome reconciliation. Do not expose this helper as an ordinary HTTP endpoint.

## 6. Content/malware — fail closed, no real scanner

Missing scanner/parser immediately denies before database processing. Processor checks signatures, size, SHA-256, scanner CLEAN result and attestation freshness; its deadline rejects non-cooperative scanners. Tests include unavailable, unsafe, unknown, error, exception, stale scan and changed object. Synthetic scanner/parser doubles exist only inside tests and are not environment-selected production providers.

Magic bytes are not complete format validation. The required parser and scanner interfaces have no production implementation. Real malware/content scanning: **NOT IMPLEMENTED/EXECUTED**. No real documents used.

## 7. Finalization/submission — SQL prepared, runtime untested

Existing trusted finalization writes validated state, receipt, immutable event and audit; replay is checked after serialization locks. Repaired lifecycle fixture now uses this function with unmistakably synthetic inspection provenance rather than directly setting VALIDATED/forging an unrelated receipt. It remains SQL metadata testing, not an uploaded-object test. Existing submission requires the latest finalized evidence through centralized readiness. Actual transaction/concurrency/receipt-forgery tests require disposable PostgreSQL execution.

## 8. Reviewer access — partial, NOT ready for activation

Reviewer authority remains separate from assignment/workspace roles. SQL checks active authority/assignment, pending case, finalized evidence and applicant separation. Existing API returns five-minute signed URLs. **Outstanding security gap:** issued bearer URLs remain usable until expiry after authority revocation; issuing-time checks do not provide immediate revocation. Replace with authenticated per-read proxy/version-pinned streaming and recheck authority on each new access before activation. Access request idempotency and concurrent revocation/decision must also be certified.

Practical administrative procedure: independently authenticate/approve the administrator through an audited operational process, verify reviewer identity/qualification out of band, then a database-owner operator invokes the existing private `identity_reviewer_authority` grant with bounded expiry and unique request ID. Use `identity_assign` for a pending case with distinct applicant. Revoke using a new immutable authority event and revoke assignment; retain audit. No public/service-role reviewer enrolment grant is permitted. This is an operator procedure, not an implemented production admin service; do not share DB-owner credentials with reviewers/API clients.

## 9. Flutter — existing safe blocked experience preserved

No picker/upload/submission success UI fabricated. Debug-only overview, own server status, draft/resubmission/retry/account-keyed state retained. Collection-enabled responses are deliberately unsupported by this preparation client. Applicant evidence selection/upload/progress/replace/submit remains INCOMPLETE until the server path is operational. Signup, booking continuation, driver/owner/vehicle/fleet/subscription boundaries unchanged.

## 10. Tests added/prepared

Worker synthetic tests cover binding, byte/version replacement, unavailable scanner/parser, invalid content, unsafe/unknown/error/stale scanner, callback timeout and late-read rollback, expiry/revision and pre-parser size limits. SQL fixtures now prepare exact reservation retry, null input, conflicting retry and cross-account denial using a disposable-only enabled synthetic policy, then close collection again. Negative assertions were retained, not weakened. These SQL cases have NOT run on PostgreSQL.

## 11. Actual results

- Full Flutter `flutter test --no-pub --reporter expanded`: **214 passed, 0 failed, exit 0**.
- `flutter analyze --no-pub`: **No issues found**.
- Dart format verification: **135 files, 0 changed**.
- Direct signature AST audit: **37 migrations, errors []**.
- Direct fixture-role AST audit: **errors []**.
- Full final `npm test`: **161 passed, 0 failed, 0 skipped, exit 0** after the size-guard change. Includes static AST/composition/fixture checks and synthetic worker regressions, NOT runtime SQL certification.
- Approved database probe: **127.0.0.1:5433 — no response**. Probe exit 1 is not a SQL test failure or a passed migration replay.
- No remote CI triggered. Earlier closed-foundation CI does not certify this 37-migration chain.

## 12. Runtime status

Clean replay, real Auth/Storage, genuine uploaded evidence, independent-connection concurrency, trusted worker transaction and reviewer byte delivery: **NOT CERTIFIED**. No collection/enforcement activation permitted.

## 13. Remaining dependencies

Approved content/evidence/reviewer and retention policy; real parser/scanner; trusted transaction/Storage adapter; immutable object versioning; upload lifetime enforcement; per-read revocation; retention/deletion/legal-hold/account deletion; real SQL/HTTP/concurrency tests. No regulatory rules or document categories invented.

## 14. Files changed this pass

- New `supabase/functions/garilink-api/identity_evidence_worker.ts`.
- New `supabase/tests/identity-evidence-worker.test.ts`.
- Existing uncommitted transport migration above.
- `supabase/tests/identity-evidence-contract.test.mjs`.
- `supabase/tests/identity-evidence-assertions.sql`.
- `supabase/tests/identity-lifecycle-assertions.sql`.
- This report. Earlier processor hardening remains present unchanged.

## 15. Next certification instructions

First implement the actual immutable Storage/transaction worker adapters, full parser/scanner and authenticated reviewer proxy in a disposable-only environment. Preserve disabled production defaults. Then review a separate Git/CI batch; obtain push/execution authorization before using existing GitHub workflow. Replay all 37 migrations, all seven original SQL suites plus closed/preparation/lifecycle/evidence, preserve closed Auth/Storage coverage, and add actual synthetic-file ordinary-session tests and independent transaction races. Keep immutable history; destroy only explicitly disposable infrastructure or use transactional fixture rollback. Do not grant broad privileges to make cleanup pass. No hosted operations authorized by this report.

SPRINT 3.7B: INCOMPLETE
