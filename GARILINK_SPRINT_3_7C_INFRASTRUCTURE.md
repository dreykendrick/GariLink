# Sprint 3.7C — real evidence infrastructure integration

2026-10-23. **IMPLEMENTED LOCALLY / NOT RUNTIME-CERTIFIED. Production collection and enforcement remain disabled.**

## 1. Exact baseline

Worktree `GariLink-person-identity`, local branch `codex/person-identity-lifecycle`, HEAD `bc908897d89d55017d27c16e66e478c5b37e71fe`. Chain expanded from 37 to **38** with forward-only `20261023010000_identity_sealed_infrastructure.sql`. Existing uncommitted preparation/review/evidence work preserved. No reset, staging, commit, push, PR modification or deployment. Renter-owner, certification PR #1 and investor worktrees untouched.

## 2. Storage adapter — IMPLEMENTED; HTTP contracts tested locally

`PrivateEvidenceStorage` uses actual Supabase HTTP uploads/authenticated downloads, redirect rejection, cancellation, bounded 5 MiB reads, and create-only uploads (`x-upsert=false`). Only server-configured role-scoped ingest/sealer/reader credentials are accepted; the service-role credential is explicitly rejected. Decoding a token role is a configuration guard, NOT cryptographic authentication: the actual Storage server must authenticate the token and enforce the role policies.

Separate NOLOGIN roles have quarantine INSERT, sealed INSERT/SELECT, or sealed read-only capabilities. No UPDATE/DELETE grants/policies added for these roles. A dedicated DB worker role gets only private snapshot/commit/outcome RPCs, not raw tables or raw inspection functions. Required authenticating-role membership is prepared by migration when the real Supabase authenticator role exists.

Actual Storage role behavior is **NOT CERTIFIED** until the prepared run executes.

## 3. Upload expiration — IMPLEMENTED; HTTP contracts tested locally

Reservation API no longer issues signed Storage upload tokens. It returns the application upload endpoint. Binary upload authenticates the ordinary applicant, calls SQL ownership/policy/revision/expiry authorization before receipt, after bounded receipt, and after Storage completion. No arbitrary path is accepted from a client. Late/reused requests cannot overwrite quarantine or sealed evidence.

[Supabase documents signed uploads as two-hour unauthenticated bearer capabilities](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl), which is longer than the existing short reservation. Previously issued tokens cannot be recalled by changing a DB timestamp. If any exist in another environment they may still create their unique quarantine object until token expiry, but cannot write sealed keys, overwrite objects with this flow, or activate an expired reservation. A transfer already in flight may leave unaccepted quarantine bytes after expiry; finalization rechecks the reservation and fails closed. Quarantine disposal/retention must be approved before real collection.

## 4. Immutable evidence boundary — IMPLEMENTED; runtime untested

Actual downloaded bytes are parsed/scanned, uploaded to a deterministic document/version/SHA-256 sealed key using an INSERT-only identity, reread and digest-verified, then bound to an immutable sealed-object record. Readiness now requires this record, matching digest, finalization event and trusted inspection. New versions use new keys. External scan/HTTP work happens before final SQL locks.

The guarantee is against ordinary applicants/reviewers and the constrained ingest/sealer roles. Database owners, Storage administrators, compromised JWT signing authority or infrastructure owners remain privileged trusted operators; this is not S3 Object Lock or hardware WORM. Reviewer delivery hashes actual sealed bytes before release, so even privileged corruption fails closed at delivery. Real overwrite-denial/integrity tests are still required.

## 5. Content parser — IMPLEMENTED / EXECUTED LOCALLY

Actual PNG chunk CRC validation, critical chunk sequence, dimensions/pixel bounds, bounded zlib decompression, exact decompressed scanline lengths and valid filter bytes. Only an explicit narrow test subset is accepted: 8-bit RGB/RGBA, non-interlaced, IHDR/contiguous IDAT/IEND, no extra/trailing payload. Unsupported PNG features, JPEG and PDF fail closed. This is not general document support or real-world identity authentication. Generated complete PNG bytes were decoded locally; corrupt/truncated/signature-only/polyglot inputs rejected.

Reference: [W3C PNG specification](https://www.w3.org/TR/png-3/). This implementation is deliberately stricter than the general format.

## 6. Scanner — ADAPTER IMPLEMENTED; real scan BLOCKED pending isolated execution

ClamAV Unix-socket VERSION and INSTREAM implementation, bounded frame/reply/size/time handling, signature-database freshness check and abort/socket cleanup. Only exact daemon CLEAN response is accepted; unsafe/error/outage/stale results fail closed. Attestation binds the scanned SHA-256, engine and scan time. No production test-double provider or client-generated CLEAN path exists.

[ClamAV's protocol](https://docs.clamav.net/manual/Usage/ClamdProtocol.html) does not authenticate/encrypt its TCP socket; this adapter intentionally accepts a private Unix socket only. Run in an isolated Linux worker beside clamd/freshclam with protected socket ownership and resource bounds, not inside the public Edge request path.

This Windows environment has no usable daemon for this adapter. Only missing-daemon rejection executed locally. **No actual clean/unsafe daemon scan is claimed.** Prepared CI installs a daemon, updates real signatures and tests both PNG and the harmless standard EICAR detection sample. Failed updates/start/scans fail the job; no fake fallback.

## 7. Trusted database integration — IMPLEMENTED; runtime untested

Pinned `postgres@3.4.7` driver with parameterized queries, verified TLS outside loopback, dedicated restricted login checks, short finalization transaction, lock/statement timeouts and case-before-document locking. External IO/scanning is outside SQL transactions. SQL rechecks latest version, revision, approved policy, collection control, expiry, digest/size/MIME and CLEAN provenance before atomically inserting inspection/sealed binding/receipt/finalization/audit.

Exact retries use immutable outcomes. Connection failure during/after COMMIT triggers outcome reconciliation; unresolved outcomes require retrying the same request ID, never inventing another successful operation. No distributed transaction exists between Storage and SQL: a failed commit can leave an unreferenced sealed object, never accepted evidence. Cleanup needs an approved orphan/retention process. Cancellation before commit prevents new finalization; once a commit has begun its immutable outcome must be reconciled, not assumed rolled back by a network abort.

The dedicated login must only inherit `garilink_evidence_worker`; it must not be a superuser, bypass RLS, create roles/databases, mutate private tables or invoke raw inspections. Driver verifies these properties before operations. No DB-owner credential is placed in Edge/Flutter.

## 8. Reviewer proxy — IMPLEMENTED; HTTP contracts tested locally

Ordinary reviewer session authorizes/audits each request. SQL rechecks current qualification, assignment, case, finalized evidence and applicant separation. Ordinary reviewer RPC returns only an opaque access ID and safe binding, not Storage paths. A separately role-scoped server-only resolver rechecks authority and resolves the sealed path. Proxy downloads at most 5 MiB, verifies digest/MIME/length, reauthorizes immediately before returning bytes, and emits no-store/nosniff/attachment headers. It returns no signed URL, redirect, credential or private path. HTTP ranges are denied with 416; conditional cached delivery is not used.

Delivery is bounded-buffered, not unbounded pass-through: integrity is checked before response creation. Request cancellation propagates to retrieval; streaming errors during retrieval deny delivery. New requests after revocation fail; revocation during retrieval is rechecked before release. Already authorized/in-progress delivery may complete, and previously downloaded bytes cannot be recalled. Continuous mid-stream revocation is NOT promised.

SQL/real Auth revocation remains unexecuted; mocked HTTP denial is not SQL certification.

## 9. Lifecycle/Flutter integration

Existing submission/decision paths consume centralized readiness, now requiring a sealed binding. Existing review/audit/expiry/revocation contracts preserved. SQL-only lifecycle fixture explicitly seeds synthetic sealed provenance; it is NOT proof of Storage/scanning.

Flutter preparation interface unchanged and production-disabled. No upload success, approval, auto-booking or enforcement fabricated. Full applicant picker/progress/submit UI remains deferred until runtime infrastructure passes. Driver, vehicle, owner/fleet, subscription and person identity remain separate.

## 10. Runtime execution status

**NOT TESTED AGAINST REAL DISPOSABLE INFRASTRUCTURE.** Did not repeat unavailable local DB probes. Prepared executable `platform-identity-evidence.ts` requires GitHub/disposable flags, exact loopback API/DB, and a private test scanner socket. A local guard invocation rejected execution before connecting, as intended.

Prepared real run creates disposable confirmed accounts through Admin API, obtains ordinary password sessions, uploads through the actual handler/Storage, scans/decode/seals, finalizes via restricted DB login, submits, assigns reviewer, delivers exact bytes, revokes authority and verifies denial. Concurrent HTTP case creation, duplicate worker finalization and conflicting reviewer decisions are prepared. None is marked PASS yet.

Original seven SQL suites, closed/preparation/lifecycle/evidence suites and added infrastructure privilege suite remain in the rollback logic job. Historical 65 real closed-platform HTTP assertions run BEFORE test-only collection activation. Immutable test histories are retained until the entire disposable stack is destroyed; no audit/FK weakening to delete users.

## 11. Regression

- Final Node suite: **173 passed, 0 failed, 0 skipped, exit 0** (local unit/HTTP contracts/static checks).
- Full Flutter: **214 passed, 0 failed, exit 0**.
- Analyzer: **No issues found**.
- Formatter: **135 files, 0 changed**.
- Signature AST: **38 migrations, errors []**; SQL composition/fixture-role checks included in passing Node suite.
- New workflow YAML parsed, read-only permissions/two jobs confirmed.
- Scoped literal credential/private-key pattern scan: 0 matches; not a substitute for formal secret review.
- Diff whitespace clean; nothing staged.
- Clean migration replay, actual scanner, real Auth/Storage/role grants and concurrency: **NOT EXECUTED**.

## 12. Outstanding security gates

Real custom-role JWT acceptance by Storage/PostgREST; role grants/ownership; actual clean replay; upload expiry/replay and late completion; malformed stored bytes; scanner availability/freshness/unsafe cases; sealed overwrite/delete denial; forged receipts; version replacement; unauthorized read/range/cancellation; transaction timeout/uncertain commit; isolated two-session concurrency and case projection. Prepared happy path/concurrency script does not yet exhaust every negative matrix row. Stop at the first causal CI error and preserve evidence; no weakening of assertions.

## 13. Policy decisions

No real collection authorized. Required formats/evidence, reviewer qualifications/operational approvers, retention/quarantine/orphan disposal, legal holds, audit/account-removal/subject rights, scanner operations/freshness policy and authorized production infrastructure must be approved. Test-only durations and PNG subset are NOT national/legal document policy.

## 14. Proposed source batch

The complete feature delta against the certified baseline is **41 source/workflow files** (including existing Sprint 3.6/3.7 code), listed with SHA-256 and sizes in `GARILINK_SPRINT_3_7C_REVIEW_MANIFEST.json`. Proposed remote scope: these 41 files plus the manifest = **42 files**. Reports are local handoff records, not part of that proposed commit. No generated backend/dist, customer fixtures, environment files, privileged credentials, approved image rewrites or investor adapters included.

- `.github/workflows/identity-evidence-certification.yml`
- `mobile_flutter/lib/core/navigation/app_router.dart`
- `mobile_flutter/lib/features/profile/presentation/pages/profile_page.dart`
- `mobile_flutter/lib/features/verification/data/identity_repository.dart`
- `mobile_flutter/lib/features/verification/domain/verification_decision.dart`
- `mobile_flutter/lib/features/verification/domain/verification_requirement.dart`
- `mobile_flutter/lib/features/verification/presentation/identity_preparation_page.dart`
- `mobile_flutter/lib/features/verification/presentation/verification_action_preview.dart`
- `mobile_flutter/lib/features/verification/presentation/verification_checklist.dart`
- `mobile_flutter/test/identity_preparation_test.dart`
- `mobile_flutter/test/verification_checklist_test.dart`
- `mobile_flutter/test/verification_decision_test.dart`
- `supabase/functions/garilink-api/handler.ts`
- `supabase/functions/garilink-api/identity_evidence_processor.ts`
- `supabase/functions/garilink-api/identity_evidence_worker.ts`
- `supabase/functions/garilink-api/index.ts`
- `supabase/identity-worker/clamav.ts`
- `supabase/identity-worker/database.ts`
- `supabase/identity-worker/png.ts`
- `supabase/identity-worker/process.ts`
- `supabase/identity-worker/storage.ts`
- `supabase/migrations/20261014010000_person_identity_preparation.sql`
- `supabase/migrations/20261021000000_person_identity_review_lifecycle.sql`
- `supabase/migrations/20261023000000_identity_evidence_transport.sql`
- `supabase/migrations/20261023010000_identity_sealed_infrastructure.sql`
- `supabase/package-lock.json`
- `supabase/package.json`
- `supabase/tests/audit-fixture-roles.py`
- `supabase/tests/clamd-disposable.conf`
- `supabase/tests/identity-evidence-assertions.sql`
- `supabase/tests/identity-evidence-contract.test.mjs`
- `supabase/tests/identity-evidence-processor.test.ts`
- `supabase/tests/identity-evidence-worker.test.ts`
- `supabase/tests/identity-infrastructure-assertions.sql`
- `supabase/tests/identity-infrastructure.test.ts`
- `supabase/tests/identity-lifecycle-assertions.sql`
- `supabase/tests/identity-lifecycle-contract.test.mjs`
- `supabase/tests/identity-preparation-api.test.ts`
- `supabase/tests/identity-preparation-assertions.sql`
- `supabase/tests/platform-identity-evidence.ts`
- `supabase/tests/run-ci-sql.mjs`

## 15. Exact controlled execution plan — AWAITING AUTHORIZATION

1. Review the manifest and source diff; verify all hashes and unchanged certified baseline.
2. Obtain explicit approval to commit/push only this **42-file** batch onto new isolated `codex/identity-evidence-certification-20261023`. Do not alter PR #1 or the dirty product worktree.
3. Reconfirm remote baseline/branch state. Create a separate reviewed Git snapshot/worktree or connector tree; no automatic merge.
4. Push the approved isolated branch to trigger only `identity-evidence-certification.yml`; capture exact SHA/run/job IDs.
5. `postgres-logic`: disposable PostGIS, all 38 migrations, original seven plus closed/preparation/lifecycle/evidence/infrastructure SQL suites, full Node suite.
6. `supabase-platform`: real Supabase start + clean replay, health/schema/closed SQL and 65 closed HTTP assertions; private ClamAV startup/fresh signatures; real synthetic evidence runner. No production secrets.
7. Preserve actual outputs and earliest causal failure, stop before any correction push without separate approval. Destroy disposable services after success/failure. Never modify hosted Supabase or delete immutable production audit.
8. Only after this real run succeeds expand missing negative/concurrency coverage, then integrate genuine applicant UI. Do not authorize production collection from a green first run alone.

The workflow file has been prepared, NOT remotely installed or executed. ClamAV package/signature downloads and custom-role integration can fail; these are genuine gates, not bypassable placeholders.

## 16. GO / NO-GO

**GO to review and authorize the first controlled Sprint 3.8 disposable CI execution. NO-GO for operational/production KYC or claiming security certification.** No production Auth/settings/Edge changes, real documents, Git writes or PR merge performed.

SPRINT 3.7C: INCOMPLETE
