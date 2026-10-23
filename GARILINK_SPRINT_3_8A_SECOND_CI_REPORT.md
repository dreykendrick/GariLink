# Sprint 3.8A — second controlled CI execution

## Authorized commit and preflight

2026-10-23. Parent/local/remote head reverified as `63e90be14e64fc2d58d817904245f00e43f1187e`. Exactly four manifest-listed paths staged and reviewed; three source byte counts/SHA-256 values matched. Manifest SHA-256 was `3f7ad9cd0b1a94b095aa1e7b1641d3acc5eeb519bf92af087b3778f332a9858c`. Historical manifest unchanged. Credential-pattern scan and diff whitespace checks passed; synthetic fixtures manually reviewed. Workflow remains contents-read-only, disposable/local-only PostGIS/Supabase/ClamAV with unconditional teardown; no deployment operations or production secrets introduced.

One corrective commit: `c46706850ee6b98c0231e468f3b5fb8317bebbef`. Tree `76a92f88c9a59a9619c92a1a0f935b755d2d3ff1` exactly matched local index tree. Published once to the authorized existing branch with expected-parent guard, then fetched and aligned the isolated local ref to that same commit without resetting files. No second correction commit, push, dispatch or rerun. The committed manifest remains the historical pre-execution review snapshot, not a mutable outcome report.

## Run and jobs

[Run 39928612902](https://github.com/dreykendrick/GariLink/actions/runs/39928612902), push event, attempt 1, overall FAILURE. Created 08:59:40 UTC; completed 09:02:51 UTC (11:59:40–12:02:51 EAT).

| Job | ID | Conclusion | UTC start / completion |
| --- | --- | --- | --- |
| postgres-logic | 120331057445 | PASS | 08:59:43 / 09:00:23 |
| supabase-platform | 120331057093 | FAIL | 08:59:43 / 09:02:50 |

## PostgreSQL and Python

All 38 canonical migrations and actor-helper stage executed successfully. All 12 SQL suites emitted PASS: identity, workspace, marketplace, rental, pricing, media, email-auth, verification-closed, identity-preparation, identity-lifecycle, identity-evidence, identity-infrastructure. Final ROLLBACK reached, exit 0. This is real PostgreSQL/PostGIS with the logic harness's Auth/Storage stand-ins, not real Auth integration.

CI explicitly reports `Successfully installed pglast-7.21`. Full Node/static regression now EXECUTED in CI: **174 tests, 174 passed, 0 failed, 0 skipped**. Python installation blocker resolved in actual CI, including downstream signature/fixture/composition checks.

## Real platform results

38 migrations during startup and 38 during reset, 76 platform applications. Including the logic chain: 114 file executions across three clean chains, not 114 distinct migrations. Real Auth health, platform schema/RLS smoke and closed-verification SQL passed. Explicit summary: **65 real closed-platform HTTP assertions passed; two ordinary controlled email sessions; synthetic objects/accounts cleaned**.

Actual ClamAV daemon with fresh signatures initialized. Sequential evidence-runner control flow reached successful initial clean-PNG and EICAR detection, ordinary applicant/reviewer sessions, serialized case creation, reservation, no leaked upload capability, denied cross-applicant upload and accepted applicant quarantine upload. Real quarantine read, parser/scanner and sealed-create acknowledgment preceded the failure. These early evidence-runner checks are evidenced by execution position, NOT a completed evidence-suite PASS summary.

## Exact failure and causal limits

Observed at 09:02:29 UTC:

```text
STORAGE_READ_REJECTED stage=sealed-read status=500 code=UNSPECIFIED
PrivateEvidenceStorage.read storage.ts:44
inspectSealAndFinalize process.ts:31
Promise.all index 1
platform-identity-evidence.ts:94
```

This is post-create sealed verification read, not quarantine download or conflict-recovery read. HTTP 500 proves the request received an unsuccessful server response; `UNSPECIFIED` is our sanitizer fallback, NOT the actual provider code. It can mean absent/unallowlisted code, unexpected response schema or non-JSON. It does not prove authorization denial, missing object, persistence race or backend permissions. Root cause remains UNKNOWN; no SQLSTATE or storage server-side trace was captured before disposable teardown.

Successful finalization/replay, submission, reviewer delivery/revocation and competing decisions were NOT reached as completed assertions. Another concurrent worker may have progressed farther; neither success nor rollback is inferred without persisted assertions. Existing closed-platform and SQL evidence do not substitute for these real accepted-evidence paths.

## Investigation and uncommitted follow-up

Logs identify exact Storage image `public.ecr.aws/supabase/storage-api:v1.69.0`. Read-only inspection of upstream pinned sources:

- https://github.com/supabase/storage/blob/v1.69.0/src/internal/errors/codes.ts
- https://github.com/supabase/storage/blob/v1.69.0/src/http/routes/object/getObject.ts

The authenticated private-object handler performs RLS-scoped metadata lookup and then backend rendering; either branch can fail. Upstream defines `InternalError` and `UnknownError`, omitted from our diagnostic allowlist. This is a demonstrated diagnostic-coverage gap, NOT evidence that either code was returned in this run.

Prepared only a local two-file follow-up: retain these two exact static enum values and add two privacy cases to the existing test. No provider messages/paths/bodies exposed, no retries, no permissions or policy changes. Updated local full suite: **174 passed, 0 failed, 0 skipped, exit 0**; diff check clean. These local modifications are NOT staged, committed or pushed and are NOT covered by the exhausted execution approval. Original committed 3.8A manifest preserved unchanged. No underlying Storage fix can be responsibly selected yet; safe next investigation needs provider error classification and, if still opaque, narrowly filtered disposable server diagnostics without raw request/document/token logging.

## Cleanup and evidence

PostgreSQL container teardown passed. Supabase cleanup step passed with `Stopped supabase local development setup`; immutable synthetic evidence histories remained only within destroyed disposable services. No hosted Supabase mutation or real documents.

Evidence directory: `ci-evidence/sprint-3-8a/run-39928612902/` contains redacted complete job logs and job/step metadata.

- postgres-logic.redacted.log SHA-256 `7EF21D2502FA0CD76863562D64595576074D1567F2082B9E57C89E62F5176145`
- supabase-platform.redacted.log SHA-256 `2FAC66EE6D176FBED653FBAC1338DA9A4D44776524D5CA16EC88606DEE260349`

## Outstanding security coverage and verdict

Still unexecuted: complete accepted-evidence finalization/reviewer lifecycle; forged-role and unauthorized sealed access matrix; expiry/replacement races; actual scanner outage/timeout/stale signatures; reviewer assignment expiry/access revocation races; cross-case/range/cache/digest/cancellation negatives; transaction timeout/uncertain-commit recovery; independent-session concurrency.

PR #1, original product/identity/investor worktrees, hosted infrastructure, production collection/enforcement and deployments untouched. No Flutter changes or new Flutter certification claim.

**Python blocker RESOLVED. Diagnostic objective EXECUTED. Sealed Storage read STILL FAILS; underlying cause NOT ESTABLISHED. Overall Sprint 3.8 certification INCOMPLETE / NO-GO for production or the next lifecycle feature stage.** Further diagnostic publication requires separately reviewed scope and explicit approval. No further remote execution performed.
