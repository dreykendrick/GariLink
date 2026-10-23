# Sprint 3.8 — first controlled execution

2026-10-23. **PARTIALLY CERTIFIED — overall workflow FAILED. Production KYC remains prohibited.**

## 1. Authorized source and commit

Executed only the reviewed 42-file batch on the new isolated branch `codex/identity-evidence-certification-20261023`.

- Parent: `bc908897d89d55017d27c16e66e478c5b37e71fe`.
- Single new commit: `63e90be14e64fc2d58d817904245f00e43f1187e`.
- Tree: `2076a3bd632abf972009fc42124906838c3188a1`, independently equal to local `git write-tree` of the approved index.
- Exactly 42 files, 3,252 insertions / 1 deletion. Original source and canonical staged hashes verified before publication; no extra files/dependencies/credential patterns.
- Reviewed manifest SHA-256: `15b57a651ce38a6468a0cc020e1e1ca943346d4c42ee81c434e9552fe8eba317`. It records both original Windows and LF-normalized Git hashes.
- Published through the authenticated GitHub connection, then fetched/synchronized the isolated local branch to the SAME commit; no duplicate local/remote commit. Exactly one initial branch publication, one push-triggered run, attempt 1. No retry/dispatch/correction push.

## 2. Exact workflow and jobs

[Run 39923510468](https://github.com/dreykendrick/GariLink/actions/runs/39923510468), event `push`, conclusion **failure**.

| Job | ID | Conclusion | UTC execution |
| --- | --- | --- | --- |
| postgres-logic | 120314170835 | FAILURE | 08:16:40–08:17:23 |
| supabase-platform | 120314170746 | FAILURE | 08:16:40–08:25:52 |

Run created 08:16:37 UTC (11:16:37 EAT); completed 08:25:52 UTC (11:25:52 EAT). Logs and metadata preserved under `ci-evidence/sprint-3-8/run-39923510468/`.

## 3. Actual migration execution

**PASS:** all 38 canonical migrations executed in the disposable PostgreSQL logic chain. All 38 also applied during real Supabase startup and again during clean local reset: **76 real-platform applications**, **114 file executions across three isolated chains**, not 114 distinct migrations. Platform logs contain exactly 76 `Applying migration` entries, ending both times at `20261023010000_identity_sealed_infrastructure.sql`.

No migration failure or SQLSTATE occurred. PostgreSQL logic used actual PostgreSQL 17.5 with the pinned PostGIS image and explicit Auth/Storage stand-in schemas. Those stand-ins are NOT real Supabase authentication.

## 4. SQL authorization results

All **12 SQL suites PASS**, plus the preceding request-actor helper stage:

1. identity
2. workspace
3. marketplace
4. rental
5. pricing
6. media
7. email-auth
8. verification-closed
9. identity-preparation
10. identity-lifecycle
11. identity-evidence
12. identity-infrastructure

Final SQL output reached `ROLLBACK`, exit 0. This provides real PostgreSQL evidence for the assertions actually present, including private-role grants, receipt/authority restrictions and immutable-history tests. SQL-only inspection/decision fixtures remain synthetic metadata, not proof of actual uploaded bytes/scanning. Passing this stage does not certify every concurrency or HTTP boundary.

The logic JOB failed AFTER this stage: Python dependency installation could not resolve `pglast==7.10`; `npm ci`/`npm test` in that CI job were not reached. Do not report CI Node test failures or a CI pass count where none ran.

## 5. Real Auth / closed-platform results

**PASS:** real Supabase startup/reset, schema/RLS smoke, Auth health, closed verification SQL, and the unchanged **65 closed Auth/Storage HTTP assertions**. Explicit log summary confirms **2 ordinary controlled email sessions** and synthetic object/account cleanup.

The later accepted-evidence runner also provisioned separate synthetic applicant/reviewer accounts through legitimate disposable Admin API tooling, obtained ordinary email/password sessions and progressed through case/reservation/upload. This is NOT certification of public signup/email delivery, phone recovery, all session-restoration behavior or production KYC.

## 6. Real Storage results

The new runner progressed past authenticated reservation, no-signed-upload-capability response, denied cross-applicant upload (the expected logged 403), and actual successful quarantine upload. The restricted processor snapshot/identity checks and quarantine read occurred before the failure.

**FAIL:** reading the sealed object after its create operation returned success. Stack identifies `PrivateEvidenceStorage.read` at committed `storage.ts:35`, called from `process.ts:31` (`const sealed=...read('verification-sealed',...)`), inside concurrent worker `Promise.all` index 1.

Observable error: `STORAGE_READ_REJECTED`. The committed adapter discarded the upstream status/code/body, so it is NOT yet possible to establish whether the cause is authorization, object existence/visibility, backend behavior or another HTTP failure. Do not guess that this is an RLS defect or grant broader privileges. Sealed creation acknowledgment is not a passed integrity/readability/finalization guarantee.

## 7. Real ClamAV results

Private Unix-socket daemon started with genuine signatures. Log reports current daily database version 28162 and main version 63. Initial real clean-PNG scan and harmless standard EICAR detection checks passed before applicant setup; otherwise the strict sequential runner would have aborted earlier. Uploaded PNG parsing/scanning also preceded the observed sealed reread failure.

These early checks are established by execution position and strict control flow, not a completed evidence-suite PASS summary (none was printed). Outage, timeout, stale/missing-signature and unsafe accepted-evidence pipeline matrices remain unexecuted in this run. No fake CLEAN provider was used.

## 8. Worker/finalization results

Real dedicated login and private outcome/snapshot RPC calls were reached; quarantine bytes went through the parser/scanner path. The new accepted-evidence runner did NOT reach its successful-finalization/replay assertions because one parallel worker failed at sealed reread.

No successful new-runtime finalization is certified. Another concurrent task may have progressed farther before cleanup; without persisted-result assertions it must not be inferred either successful or rolled back. Its disposable database has since been destroyed. Logic-job SQL finalization fixture assertions passed separately; they are not a substitute for real Storage-to-receipt certification.

## 9. Reviewer access

The new real-evidence submission, reviewer assignment, byte proxy, revocation and decision stages were **NOT REACHED**. Existing closed-foundation reviewer-denial checks/SQL fixtures remain passed only within their own documented scope. No claim of real sealed reviewer delivery or real revocation enforcement from this run.

## 10. Concurrency

Parallel case-creation HTTP calls reached the expected single-winner/409 assertion before upload. Both calls use the same ordinary applicant token; this does not fulfill an exhaustive independent-Auth-session matrix.

Concurrent exact finalization was attempted but failed before its success assertion. Competing decisions, replacement/submission races, processing expiry, retrieval-time revocation, forced transaction timeout and uncertain-commit reconciliation were NOT executed/certified. Unit/mock cases do not close these gaps.

## 11. Local corrective patches and tests — NOT committed/pushed

Only in the isolated certification worktree:

- Workflow: one-line pin change `pglast==7.10` → `pglast==7.21`. Fresh official PyPI lookup also cannot resolve 7.10 for Python 3.13, so changing Python alone was rejected as an inadequate correction. A temporary Python-version step was removed; final diff contains no new action or toolchain layer.
- Storage adapter: retain only HTTP status and an allowlisted non-sensitive error code for failed reads, never provider message/path/token/document bytes. This is a diagnostic correction, NOT a proven fix for the sealed-read defect.
- One regression verifies sanitized diagnostics without leaking provider detail.

Parser 7.21 installed solely into `ci-evidence/.../python-tooling/` virtual environment; no global Python/Windows modification. Final full local Node/static suite: **174 passed, 0 failed, 0 skipped, exit 0**. Original source manifest remains the immutable record of the executed commit; local patches do NOT match its old workflow/adapter/test hashes and must undergo a separate review before any next push. No assertions weakened, RLS/grants changed, retries added to conceal failures, or scans bypassed.

Flutter preflight for the executed source: **214 passed**, formatter **135 files / 0 changed**, analyzer **No issues found**. No Dart source changed by these local patches. CI Node suite was NOT reached; local test results must remain labeled local.

## 12. Evidence and cleanup

- `postgres-logic.redacted.log`: complete sanitized job log, SQL PASS markers and pip failure.
- `supabase-platform.redacted.log`: complete sanitized platform job log, migration replay, 65-check PASS and sealed-read stack.
- `run-summary.json`: exact SHA/run/jobs/step conclusions/timestamps.

PostgreSQL service container cleanup passed. Real Supabase stop-without-backup cleanup passed (`Stopped supabase local development setup`). The 65-check objects/accounts were explicitly cleaned. Later synthetic cases/accounts/immutable histories were retained only inside the disposable stack until its destruction; no production history deletion, FK weakening or hosted mutation. Ephemeral scanner processes/files disappear with runner teardown.

## 13. Security boundaries and remaining gaps

PR #1 remains OPEN/unmerged at `bc908897d89d55017d27c16e66e478c5b37e71fe`; remote certification branch remains at the single approved SHA. Original identity, renter-owner and investor files were not modified. No production keys, hosted migrations, deployments, real documents, KYC enforcement, payments or subscriptions.

Still required: exact sealed-read cause, complete accepted-evidence finalization/review, custom-role forged JWT/overwrite/delete/list negatives, expanded scanner failure matrix, expiration/replacement/identity-session/concurrency/fault recovery, reviewer range/cache/digest/cancellation cases, and approved production document/retention/deletion/reviewer/privacy operations. First-run partial evidence is not production authorization.

## 14. Verdict / next step

**PARTIALLY CERTIFIED** for the passing PostgreSQL suites, real closed-platform scope and early real scanner/Auth/upload checks only. **Overall workflow FAILED; NO-GO for full identity-lifecycle certification or the next feature phase.**

Next action requires separate authorization: review the three local correction files (workflow, Storage diagnostics and regression), update the proposed review manifest as appropriate, commit/push the explicitly approved corrective batch, and execute a second controlled run to obtain the missing Storage status/code. Do not change policies based on speculation. Do not claim the underlying sealed-read failure fixed until its cause is proven and the affected real path reruns successfully.

No second commit or push has been made.
