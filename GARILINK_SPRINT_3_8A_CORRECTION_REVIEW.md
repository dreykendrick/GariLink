# Sprint 3.8A — controlled correction review

2026-10-23. **GO for a separately authorized diagnostic CI run; NO-GO for completed security certification or production collection.**

## 1. Starting commit and Git state

Local HEAD and read-only GitHub branch lookup both equal `63e90be14e64fc2d58d817904245f00e43f1187e` on `codex/identity-evidence-certification-20261023`. Index is empty; three tracked source modifications plus this report, the new manifest and existing untracked first-run evidence. No commit, push, dispatch or hosted mutation performed. Original product worktrees and PR #1 untouched.

## 2. Reviewed corrective batch

Exactly four proposed commit paths are listed in `GARILINK_SPRINT_3_8A_CORRECTION_MANIFEST.json`: workflow, Storage adapter, infrastructure regression test and the NEW manifest. This report, historical report, logs and virtual environment are excluded. The historical 3.7C manifest remains unchanged at SHA-256 `15b57a651ce38a6468a0cc020e1e1ca943346d4c42ee81c434e9552fe8eba317`.

Workflow changes only `pglast==7.10` to `pglast==7.21`. Storage changes only failed-read diagnostics. The regression adds four cases inside one test, with exact safe messages and a single-request assertion. No migration, ACL, RLS, role, expiry, scanner, digest, write/upsert, audit or decision behavior changed. Existing create-only and scoped-identity tests remain intact.

## 3. Python dependency evidence

First CI pip output explicitly cannot resolve 7.10 and lists 7.21 as available. Local isolated Python 3.13.7 virtual environment installs 7.21 from official PyPI; no global Python or Windows changes. Package metadata explicitly lists Python 3.9 through 3.14 support, including Python 3.12. A no-cache force reinstall from official PyPI completed successfully, exit 0, independently of the previous cached install.

The workflow uses unversioned runner `python`; the first log does NOT record its exact interpreter version. Therefore exact CI interpreter/install compatibility is still to be demonstrated by the next real run, not inferred from the local Windows wheel. No unrelated dependencies upgraded or new setup action introduced.

## 4. Sealed-read diagnostic

Actual first-run diagnostic remains only `STORAGE_READ_REJECTED`; HTTP status/code were discarded. The new diagnostic format is `STORAGE_READ_REJECTED stage=sealed-read status=<HTTP integer> code=<allowlisted code or UNSPECIFIED>`, with `quarantine-read` for the other validated bucket. These are static operation labels, not object paths or applicant identifiers. No fabricated observed status/code is reported.

Provider messages, arbitrary codes, non-JSON bodies, document contents, JWTs, URLs and identities are not included in thrown diagnostics. Synthetic fixtures verify 404/403/401/500 sanitization and no automatic retry. Existing process stack identifies the real failure at the post-create sealed read, not quarantine read or the create-conflict recovery read.

## 5. Root cause

Python tooling cause established: unavailable pinned distribution. Sealed-read cause **UNKNOWN** pending real status/code. No assumption of RLS failure, missing object, race or wrong role is justified yet. Diagnostic instrumentation is NOT a repair of the underlying Storage defect.

## 6. Minimal changes and safety

Only dependency pin and diagnostic/privacy regression updated. No new permission, policy, retry, fallback, data mutation or migration. Processing digest comparison, real ClamAV safety gate, immutable versions/audit and token/reservation expiry are unchanged. No real documents or production credentials used.

## 7. Actual GitHub execution

Only [first run 39923510468](https://github.com/dreykendrick/GariLink/actions/runs/39923510468) exists as evidence for this work: postgres-logic job `120314170835` FAILURE; supabase-platform job `120314170746` FAILURE. Second corrective run NOT EXECUTED and not authorized. Redacted logs and metadata remain in `ci-evidence/sprint-3-8/run-39923510468/`.

## 8. Runtime evidence retained

First run: all 38 migrations in PostgreSQL logic, all 12 SQL suites plus actor-helper stage PASS. Real Supabase applies 38 during startup and 38 during reset: 114 migration-file executions over three chains, 38 distinct migrations. Existing 65 real Auth/Storage checks PASS, including cleanup and two ordinary email sessions. Actual quarantine upload and initial real ClamAV clean/EICAR checks succeeded before failure. New accepted-evidence finalization/reviewer flow did not complete. Disposable service cleanup passed. None of these passing subsets makes the overall workflow PASS.

## 9. Local regression and preflight

Updated full `supabase/npm test`: **174 passed, 0 failed, 0 skipped, exit 0**, using isolated pglast 7.21. Includes signature/fixture-role audits and SQL AST/composition checks. Initial sandbox-restricted invocation failed subprocess-dependent audits (165/172); rerunning with approved local subprocess permissions produced the definitive 174/174 result. No assertions bypassed.

`git diff --check` PASS. Exact three source hashes recorded in new manifest; credential-pattern scan PASS, with synthetic fixture strings manually reviewed. Workflow still has contents-read-only permissions, pinned checkout/setup-node, isolated PostGIS/Supabase/ClamAV, local-only harness guards, and always-run disposable shutdown. No production secret references or deploy operations introduced. No standalone actionlint available; workflow has only a reviewed scalar pin change, not a claimed actionlint execution.

No Flutter changes; prior executed-source preflight remains 214 tests PASS, analyzer clean, formatter 135 files / zero changed. Flutter was not rerun for this server/tooling-only batch. CI Node regression was not reached in first run; local results are not CI results.

## 10. Remaining runtime security gaps

- Complete real evidence finalization, submission, reviewer delivery/revocation and decision flow.
- Forged roles and unauthorized sealed read/list/overwrite/delete matrix.
- Reservation expiry during processing; immutable replacement and stale-version races.
- Actual scanner outage/timeout, stale/missing signatures and unsafe pipeline rejection.
- Reviewer assignment expiry, self/wrong-case access and stream-time revocation races.
- Range/cache/digest corruption/cancellation behavior.
- Transaction timeout and uncertain-commit reconciliation.
- Independent-session concurrency, submission/replacement and competing decisions.

Unit tests and a future green workflow do not close scenarios absent from executed runtime coverage.

## 11. Authorization boundary

Explicit approval needed for **one commit and one push of only the four manifest-listed files** to the existing isolated branch, triggering a second disposable CI run. No approval requested for hosted operations, PR #1 changes, production collection or additional corrective pushes. Recheck remote head and exact hashes immediately before any approved publication.

## 12. Decision

**GO to continue controlled Sprint 3.8 certification after separate approval. NO-GO for full lifecycle certification/production.** Next run should prove the parser installation and reveal safe sealed-read status/code; it may still fail. Preserve failure evidence, diagnose only the demonstrated cause and obtain another approval before any further correction push.
