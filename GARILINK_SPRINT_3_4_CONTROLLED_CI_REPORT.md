# Sprint 3.4 — controlled CI execution

2026-10-12. Overall certification INCOMPLETE. No further correction made after the failed job.

## 1. Authorized scope and preflight

Reconfirmed live remote baseline `e2dca8fe03aeb1bcf331ed2f93b3702e802c9be9` immediately before commit. Reviewed exact staged diff and confirmed only:

1. `supabase/tests/identity-fixture.sql`
2. `supabase/tests/media-assertions.sql`
3. `supabase/tests/fixture-roles.test.mjs`

Pre-push checks: full Node 121 passed / 0 failed/cancelled/skipped, exit 0; fixture-role audit errors empty; signature audit 33 migrations/errors empty; composed SQL AST 601 statements with BEGIN/ROLLBACK boundaries; workflow read-only validation PASS; staged whitespace and targeted credential-pattern checks PASS. No production permission/migration/workflow change included.

## 2. Commit, run and jobs

- Commit: `23f7111b314c76e2671fb5dd54aaebcbb4795430`.
- Branch: `codex/database-certification`, PR #1 open/unmerged.
- Commit changes: exactly 3 files, 61 insertions / 0 deletions.
- [Workflow run 38300821708](https://github.com/dreykendrick/GariLink/actions/runs/38300821708), run number 6, final conclusion FAILURE.

| Job | Job ID | Final conclusion |
| --- | --- | --- |
| postgres-logic | 114983044847 | FAILURE |
| supabase-platform | 114983044574 | SUCCESS |

Both monitored until definitive completion. No automatic rerun, fix, additional commit or push.

## 3. Actual migration execution

PostgreSQL/PostGIS stand-in: all 33 canonical migration statements completed before helper/identity assertions. The later test failure aborted the disposable transaction; no completed test transaction or explicit successful ROLLBACK is claimed.

Real Supabase: startup and clean local reset/replay both SUCCESS. Log contains **66 migration applications (33 + 33)**, including the closed-verification foundation. No hosted schema/history was modified.

## 4. PostgreSQL suite matrix

| Stage | Actual result |
| --- | --- |
| Request-actor helper assertions | PASS; completed before identity suite |
| Identity | PASS marker |
| Workspace | PASS marker |
| Marketplace | PASS marker |
| Rental | PASS marker |
| Pricing | PASS marker |
| Media | FAIL during reordering, after successful reservation/insertion/finalization |
| Email-auth | NOT EXECUTED |
| Closed verification in stand-in job | NOT EXECUTED |
| CI Node regression | SKIPPED after SQL failure |
| Container teardown | SUCCESS |

Seller-management assertions remain outside the existing seven-suite runner; not separately executed. Local 121/121 Node is not CI Node evidence.

## 5. Fixture correction outcome

The previous Storage schema lookup error is resolved. New pre-operation SQL assertions completed: authenticated Storage USAGE present; Storage CREATE/Auth USAGE absent; existing object INSERT privilege retained; Storage RLS enabled; authenticated not table owner/superuser/BYPASSRLS; no direct private-verification table CRUD; private KYC object insertion denied.

Log then records `INSERT 0 1` for the authorized vehicle-media upload metadata, followed by successful finalization/media-serialization assertions. This is actual runtime evidence that the narrow fixture USAGE grant permits testing existing policies, not an administrator-elevated media operation.

The new cross-workspace Storage INSERT assertion is later in the media suite and was NOT REACHED after the reorder failure. Do not describe the full media suite as certified.

## 6. Earliest causal failure

At 19:55:49.833 UTC:

```text
ERROR: constraint "gl_vehicle_media_position_unique" does not exist
CONTEXT: SQL statement "set constraints gl_vehicle_media_position_unique deferred"
PL/pgSQL function public.garilink_reorder_vehicle_media(uuid,uuid[]) line 14 at SQL statement
Process completed with exit code 3.
```

Failing invocation: media suite's photo-reordering assertion. Default logs do not print a numeric SQLSTATE.

Read-only inspection finds the actual deferrable constraint declared in `20260912010000_vehicle_media.sql:22`, on the public vehicle-media table. The reorder RPC sets `search_path=''` but defers the constraint by an unqualified name at line 103. The delete RPC has the same unqualified command at line 121. An empty search path cannot resolve that constraint's public-schema name.

Classification: **application/database RPC name-resolution defect**, not another stand-in Storage grant problem. The delete occurrence is an identified analogous risk, not a separately executed failure. Migration compilation/static signature checks cannot exercise these runtime SQL branches. No KYC data leakage or authorization bypass was demonstrated.

Smallest recommended correction, NOT IMPLEMENTED: a reviewed forward-only migration qualifying this constraint as `public.gl_vehicle_media_position_unique` in both current RPC bodies, preserving empty search_path, exact argument names, grants, tenancy/contact checks, triggers and uniqueness. Add runtime regression for reorder and delete; validate final function bodies and signature compatibility; rerun both jobs only after separate authorization. Do not remove the constraint, defer all unrelated constraints, widen search_path, weaken RLS or edit already-applied historical migrations blindly. An additive repair would increase the canonical chain count; report that honestly in the next run.

## 7. Real Supabase platform evidence

All steps SUCCESS: startup, clean replay, PostgreSQL/PostGIS/schema/RLS/RPC smoke, Auth health, closed-verification rollback SQL, real HTTP boundaries, resource shutdown.

Key log evidence (UTC):

```text
19:57:41.668 Finished supabase db reset on branch codex/database-certification.
19:57:55.010 PASS: local Supabase Auth health
19:57:55.075 PASS REAL PLATFORM CLOSED VERIFICATION SQL
19:57:57.122 PASS: real closed-platform boundaries; 65 assertions; 2 controlled email sessions; synthetic objects and accounts cleaned
19:58:17.689 Stopped supabase local development setup.
```

**65 actual HTTP assertions executed / 65 passed / 0 failed**, at this commit. Two disposable confirmed-email accounts signed in through normal email/password flow. Ordinary sessions/anon keys tested inactive decisions, private REST exposure/privilege restrictions, valid/invalid actions, existing private-object read/overwrite/sign/delete denial and new-upload policy denial. Administrative context was used only for legitimate disposable setup, independent fixture-integrity checks and cleanup.

The known valid one-pixel synthetic PNG stayed unchanged after end-user attempts. No real identity document was collected. The HTTP success occurs only after cleanup of both Auth users and all attempted synthetic paths, with absent-object verification.

## 8. Cleanup and persistence

- Real closed SQL: PASS then ROLLBACK.
- HTTP: object/user cleanup succeeded, as required by its PASS marker.
- Real Supabase shutdown: SUCCESS.
- PostgreSQL job: failed transaction ended with connection/process exit and successful container teardown; no successful full-suite explicit ROLLBACK marker is claimed.
- No developer database, hosted Supabase, production Auth/configuration, Edge deployment or Windows/Docker configuration was touched.

## 9. Logs and Git/product safety

Sanitized logs retained locally in the certification worktree:

- `ci-evidence/38300821708/postgres-logic.log`
- `ci-evidence/38300821708/supabase-platform.log`

JWT/key patterns, credential-bearing database URLs and credential lines redacted. This report/logs are uncommitted and not included in any push. The dirty product worktree was not readied, reset, staged, edited or copied into the commit. PR #1 remains unmerged. Only the one specifically authorized three-file commit/push occurred.

## 10. Certification verdict and next sprint

**Closed-foundation real Supabase denial evidence: PASS. Required overall certification: INCOMPLETE / NO-GO.** Five SQL suites and helper assertions passed; media/email-auth/stand-in closed suite and CI Node are not fully green. No overall production-KYC or seven-suite PASS claim.

Recommended immediate next sprint: **media RPC constraint qualification hardening and final controlled regression**, with explicit local correction and separate push authorization. Once both jobs pass completely, proceed to a single local person-identity lifecycle: subject-derived case creation, versioned/private evidence reservation and authorized submission, explicit reviewer assignment, immutable approval/rejection, replay/idempotency, expiry/revocation, audit/status and server-authoritative eligibility.

Operational KYC, reviewer/upload lifecycle, real document collection, retention policy, signed-access lifetime, driver/fleet/custody and booking/publication KYC activation remain unimplemented/uncertified. A later closed-foundation PASS alone does not authorize any of them or subscriptions.

SPRINT 3.4: INCOMPLETE
