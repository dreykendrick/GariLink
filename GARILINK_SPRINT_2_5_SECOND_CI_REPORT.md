# Sprint 2.5 — Migration signature correction and second CI run

## 1. Commit and authorization scope

Explicit approval covered committing/pushing exactly two files. Commit `c5899c10c394437fb28849ffaf88c3dd8b7c13ee` contains only `supabase/migrations/20260914000000_v2_vehicle_foundation.sql` and `supabase/tests/migration-signature.test.mjs`. Existing validator declarations now agree; qualified references preserve validation behavior. Positional calls were audited; no named calls were found. RLS/grants were untouched. Local preflight: signature test 1/1, full Node 104/104, zero failed/skipped, exit 0; SQL composition and targeted secret/diff checks passed.

## 2. Run

https://github.com/dreykendrick/GariLink/actions/runs/38265573896 — run number 2, new commit, not an old-commit rerun. PR https://github.com/dreykendrick/GariLink/pull/1 remains unmerged. No hosted Supabase or Windows/Docker operations occurred.

## 3. Conclusions

| Job | Job ID | Conclusion | Captured log interval UTC |
| --- | --- | --- | --- |
| postgres-logic | 114866757354 | FAILURE | 2026-10-12 14:48:20.005–14:49:02.166 |
| supabase-platform | 114866756995 | FAILURE | 2026-10-12 14:48:20.080–14:50:01.259 |

These are log timestamps, not API job timestamp fields. Both cleanup steps succeeded. Relevant logs are preserved locally under `ci-evidence/38265573896/`, with JWT-like strings redacted. Logs/report have not been committed or pushed.

## 4. Migration evidence

The real Supabase CLI applied 14 migrations, from identity through `20260914030000_v2_capability_validator_ambiguity_fix.sql`, before the fifteenth migration failed. Therefore the previous validator signature correction cleared its original failure. The stand-in logic job also passed that former failure and reached the same subsequent replacement, but its transaction aborted: no migrated schema was committed by that job. Do not describe 14 migrations as permanently applied there.

All 32 files were scheduled; the pending email-first migration was **not reached**. The complete canonical chain remains uncertified.

## 5. SQL assertions

Seven assertion files executed: **0**. Assertions passed: **0**. Platform RLS/grant/RPC smoke and Auth health: skipped. API unit step in CI: skipped because migrations failed (local 104-test result is separate). No security assertion was bypassed or weakened.

## 6. Earliest causal failure

Migration `20260914040000_v2_rpc_parameter_ambiguity_fix.sql` attempts `CREATE OR REPLACE public.garilink_v2_update_vehicle(vehicle_id uuid,patch jsonb)`. Foundation defines `target_vehicle_id uuid,patch jsonb`. PostgreSQL rejects renaming input parameters:

```text
cannot change name of input parameter "target_vehicle_id"
SQLSTATE 42P13
HINT: Use DROP FUNCTION garilink_v2_update_vehicle(uuid,jsonb) first.
```

Do not mechanically follow the DROP hint: it can affect grants/dependencies. This is another canonical fresh-chain signature defect, not an infrastructure or demonstrated RLS vulnerability. Node EPIPE after psql exit is secondary.

## 7. Smallest recommended next correction

Audit all historical CREATE OR REPLACE declarations and actual named PostgREST arguments, especially both update and publication RPCs in this migration. Align fresh-chain initial declarations with the final client/API contract and qualify parameters, without dropping functions or weakening guards. Extend signature regression to these RPCs. Treat any already-applied hosted signature mismatch as a separately reviewed forward upgrade, not permission to replay historical files. No new correction was made or pushed after this second-run failure.

## 8. Remaining real integrations

Real confirmed-email/legacy Auth login, token refresh, confirmation/recovery/replay and SMTP remain untested. Storage lifecycle, private identity documents, actual platform authorized-owner/member matrix and verified Android App Links remain separate gates. Health cannot certify them. Real KYC collection stays disabled.

## 9. Recommendation

**SQL/RLS NOT CERTIFIED. NO-GO for production deployment.** The two isolated environments executed real PostgreSQL and independently exposed the same next chain defect. No conclusions about authorization correctness can be inferred from unexecuted assertions.

## 10. Next certification sprint

Perform focused canonical RPC signature compatibility audit, prepare the smallest local fix and regression, obtain explicit approval for an additional push, then run both CI jobs at that new commit. Preserve first/second-run evidence. Do not merge PR #1 or deploy while the chain remains blocked.
