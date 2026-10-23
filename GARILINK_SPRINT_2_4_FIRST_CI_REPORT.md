# Sprint 2.4 — First controlled CI execution

## Execution identity

- PR: https://github.com/dreykendrick/GariLink/pull/1 (open, unmerged).
- Branch: `codex/database-certification`.
- Approved head: `9ffb0af1083010f25d8774daf367164f89195bdc`.
- GitHub tested synthetic PR merge SHA: `7c6fd1d86b5dc137fbc6fe6ead4b1d4e137f3efd`. This is an Actions checkout, not a merge of the PR into main.
- Run: `38262852816`, https://github.com/dreykendrick/GariLink/actions/runs/38262852816.
- PR created 2026-10-12 17:25:46 East Africa Time (14:25:46 UTC).

## Job evidence

| Job | ID | Conclusion | Evidence interval UTC |
| --- | --- | --- | --- |
| postgres-logic | 114857514224 | FAILURE | 14:25:56.886–14:26:28.442 |
| supabase-platform | 114857514585 | FAILURE | 14:25:57.417–14:27:47.042 |

Intervals are captured log timestamps, not API job started/completed timestamp fields. Both cleanup steps completed successfully. Relevant decoded job logs are preserved locally under `ci-evidence/38262852816/`; JWT-like strings are redacted. No additional push or rerun occurred.

## PostgreSQL/PostGIS

Pinned PostGIS container initialized successfully; PostgreSQL reports 17.5. Empty disposable database creation succeeded. Canonical migration execution failed before assertions with `cannot change name of input parameter "input_value"`; all seven assertion suites and API regression step were not reached. Node's subsequent EPIPE is a consequence of psql exiting on the SQL error, not the primary defect.

## Real Supabase platform

CLI installation/startup ran using supported exact-version npx, not global npm. Registry pulls initially reported rate-limit warnings but startup proceeded to actual database migrations. The first twelve migrations through `20260914010000` were applied in the disposable local stack. Migration `20260914020000_v2_capability_validator_fix.sql` failed with SQLSTATE 42P13, the same argument-name mismatch. Reset/replay, platform SQL assertions and Auth health were skipped. No Auth/Storage certification is implied.

## Root cause and prepared fix

Foundation creates `validate_vehicle_capabilities(category text,input_value jsonb)`, but three later replacements declare `category text,value jsonb`. PostgreSQL CREATE OR REPLACE cannot rename existing input arguments. This is a canonical migration-chain defect, not RLS evidence or Windows/Docker failure.

Local-only correction makes the foundation declaration match the subsequent canonical `value` signature and qualifies JSON references to preserve ambiguity protection. Existing positional calls, validation semantics, grants and policies are unchanged. It corrects replay-from-zero history; it is not a new hosted upgrade and does not rewrite any applied database/history. An already-applied database with an incompatible signature would need a separately reviewed forward remedy, not a blanket replay of this file.

Files prepared locally:

- `supabase/migrations/20260914000000_v2_vehicle_foundation.sql`
- `supabase/tests/migration-signature.test.mjs`

Local Node suite after fix: **104 passed, 0 failed, 0 skipped, exit 0**. New static signature regression verifies all four declarations keep identical input names. This test is not PostgreSQL execution. No assertions were weakened. Flutter behavior was not changed or retested in this failure-fix pass.

## Certification and next step

SQL/RLS: **NOT CERTIFIED**. Pending email-first migration was not reached. No security assertion executed; no authorization vulnerability can be concluded from this failure. Full real Auth confirmation/recovery/replay, SMTP, Storage lifecycle and private document policies remain separate outstanding integrations.

Request explicit authorization to push the local signature correction and regression test, allowing the PR workflow to run at a new head commit. An old-run rerun would repeat the same defective code. Preserve this original run as failure evidence. Additional defects may become visible only after this gate is cleared.

**GO for an authorized corrected-commit CI run. NO-GO for hosted deployment or production readiness.** No hosted Supabase changes, Edge deployments, real KYC, application release or PR merge occurred.
