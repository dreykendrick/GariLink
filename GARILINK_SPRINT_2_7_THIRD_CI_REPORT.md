# Sprint 2.7 — Third controlled CI certification

## 1. Commit/run

Authorized seven-file batch committed/pushed as `477bd8cc8fa7c3ccd5de96d1054462a48c40c182`. A trailing blank line in the reviewed report was removed when staged diff checking detected it; no functional change or extra file was added.

Run: https://github.com/dreykendrick/GariLink/actions/runs/38270180087 (run number 3). PR https://github.com/dreykendrick/GariLink/pull/1 remains unmerged. GitHub's synthetic PR merge checkout begins `6402555`; this is not a main-branch merge.

## 2. Conclusions

| Job | Job ID | Result | Captured log interval UTC, 2026-10-12 |
| --- | --- | --- | --- |
| postgres-logic | 114882217310 | FAILURE | See preserved full job log |
| supabase-platform | 114882216906 | SUCCESS | 15:25:59.002–15:28:46.724 |

Both cleanup steps succeeded. Logs preserved locally at `ci-evidence/38270180087/`; JWT-like and local sb-key values redacted. No additional correction/commit/push occurred after this run.

## 3. Migrations

Real Supabase platform executed **32/32 migrations twice**: startup and explicit clean local replay (64 logged applications). Pending email-first migration `20261009000000` appears at 15:27:32.113 UTC and 15:28:01.286 UTC. Replay finished successfully at 15:28:11.962 UTC. This provides actual PostgreSQL/PostGIS clean-chain execution evidence, not just static AST evidence.

The stand-in job also completed all 32 migration bodies before assertions, including email-first preparation access. Its encompassing rollback transaction later aborted; no migrated schema was committed by that job.

## 4. Assertion counts

- Identity suite: PASS (includes identity/bootstrap/session and SMS ledger checks).
- Workspace suite: PASS.
- Marketplace suite: PASS.
- Rental suite: started; initial rental creation/idempotent retry assertions executed, then fixture mutation failed before suite completion.
- Pricing, media and email-only assertion suites: NOT EXECUTED.

**Three of seven suites completed successfully; four started; one failed; three not reached.** No aggregate assertion count is inferred from the number of files. Node API step was skipped in this CI job because its prior step failed; previous local 106-test result is separate.

## 5. Real platform smoke

Successful platform-smoke SQL validates PostGIS presence, preparation-helper existence, application-table RLS, private helper execution restriction, anonymous identity RPC denial, missing-session rejection and direct-account-write denial. Auth health passed at 15:28:26.763 UTC. These tests do not cover full authorized email/legacy login, SMTP, one-time tokens or Storage lifecycle.

## 6. Failure root cause

Earliest error in `supabase/tests/rental-assertions.sql` line 14:

```text
ERROR: permission denied for table gl_vehicles
```

The test sets role authenticated, then directly updates vehicle capabilities/availability to simulate BUSY state. Direct writes are intentionally revoked by application security. Source/log analysis classifies this as fixture-role setup failure, not permission to grant direct table access. PostgreSQL SQLSTATE for insufficient table privilege is 42501; the captured log did not explicitly print that state, so it is identified by the documented error category, not reported as a raw logged field.

Smallest recommended next fix: temporarily reset role ONLY around controlled administrative fixture mutations, then restore authenticated role and original request claims before executing protected RPC assertions. Audit other assertion fixture writes for the same setup problem. Do not broaden grants, bypass RPC checks or alter application RLS. No fix was made in this run; additional pushes require authorization.

## 7. Security interpretation

No demonstrated application security regression. Direct-table denial is consistent with intended protections. Completed suites provide limited positive tenant/privacy/privilege evidence, but full email-first SQL authorization remains uncertified because its assertion suite was never reached. Do not equate migration success with security certification.

## 8. Remaining integrations

Actual confirmed-email/legacy Auth login, refresh, confirmation/recovery/replay, SMTP delivery, Storage lifecycle/private document authorization, full platform owner/member matrix and verified Android App Links remain untested. KYC collection remains disabled.

## 9. Next sprint

Audit and correct fixture role boundaries only, run relevant local checks, obtain approval for a focused test-only push, then execute both CI jobs at the corrected commit. Preserve the current successful platform evidence and failed assertion logs. Do not merge PR #1 or deploy while required assertion suites remain blocked.

## 10. Verdict

**Canonical clean-chain migration execution: PASS. Real platform smoke: PASS. Complete SQL/RLS assertion certification: INCOMPLETE. Production deployment: NO-GO.** No hosted Supabase, production Auth, Edge Functions, real documents, Windows settings or application release were changed.
