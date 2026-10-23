# Sprint 3.4 — Storage fixture correction preflight

2026-10-12. Local correction prepared; remote execution NOT AUTHORIZED / NOT PERFORMED.

## 1. Root cause reconfirmed

Live read-only PR #1 metadata confirms open/unmerged, head `e2dca8fe03aeb1bcf331ed2f93b3702e802c9be9`. The certification worktree started clean on that commit.

Run 38298277679 failed at media's authenticated `INSERT INTO storage.objects`. `identity-fixture.sql` created Storage and granted authenticated object DML, but omitted Storage schema USAGE. That omission directly explains the logged schema lookup denial; it does not establish a production KYC vulnerability. Whether further failures exist is unknown until CI executes the corrected branch.

Reviewed current media policies and the runner: policies still enforce ownership/reservation and tenancy; all seven suites and closed verification remain active. Real platform success remains independently recorded in Sprint 3.3; none of its evidence was overwritten.

## 2. Exact reviewed correction allowlist

Only these three files are changed/staged in `GariLink-ci-kyc-certification`:

1. `supabase/tests/identity-fixture.sql`: add only `GRANT USAGE ON SCHEMA storage TO authenticated;` with its disposable-fixture explanation.
2. `supabase/tests/media-assertions.sql`: add runtime checks for Storage USAGE, no Storage CREATE, no Auth USAGE, retained object INSERT permission, enabled RLS, no ownership/superuser/BYPASSRLS, no private-verification table CRUD, denied private KYC upload, and denied cross-workspace direct Storage insertion. Existing owner insertion and all previous media/negative tests remain unchanged.
3. `supabase/tests/fixture-roles.test.mjs`: focused PostgreSQL AST regression requires exactly one fixture schema grant: authenticated Storage USAGE without grant option, CREATE, Auth access or broader grants; checks focused SQL assertions remain present.

61 insertions, 0 deletions. This report and CI logs are NOT in the correction allowlist. No canonical migration, workflow, platform check, Edge or Flutter/product code is modified.

## 3. Executed local checks

| Check | Actual result |
| --- | --- |
| Full Supabase `npm test` | 121 passed; 0 failed/cancelled/skipped; final exit 0 |
| Fixture role audit | Errors empty; exit 0 |
| Function-signature audit | 33 migrations; compatibility errors empty; exit 0 |
| SQL AST/full composition | 601 statements; 251120 characters; BEGIN/ROLLBACK checked; exit 0 |
| Workflow YAML/read-only validation | PASS, two jobs unchanged; exit 0 |
| Targeted three-file secret-pattern check | 0 credential-pattern matches; exit 0 |
| Diff/staged whitespace check | Exit 0; line-ending warnings only |

The initial focused Node assertion expected an explicit false AST field for grant_option; pglast omits default-false fields. Normalized absent to false, still rejecting true. Final full suite passes. This was a test representation correction, not a relaxed SQL permission check.

No local database/SQL security execution occurred. AST parsing is not runtime RLS/privilege evidence. Flutter unchanged, so no Flutter rebuild/test claim is made.

## 4. Remote results and historical evidence

No new commit/run URL/job IDs exist yet. Both new job conclusions: NOT EXECUTED.

Historical run 38298277679, at e2dca8f:

- Real platform: startup/replay 33 migrations each (66 applications), smoke/closed SQL/normal Auth/Storage **65/65 PASS**, cleanup PASS.
- Stand-in: request-actor and identity/workspace/marketplace/rental/pricing PASS; media failed; email-auth/closed verification NOT EXECUTED; CI Node SKIPPED.

Do not count those unexecuted branches as passing in Sprint 3.4. Required next run: all 33 migrations, helper assertions, seven SQL suites, closed verification, CI Node, real replay/smoke/65 HTTP checks, rollback and cleanup.

## 5. Git / security preservation

Only the existing separate certification worktree is edited/staged. The original dirty product worktree, backend/dist, verification UI, booking continuation, assets and prior evidence remain untouched. Neither branch head changed; no commit, push, CI trigger, PR merge or hosted operation occurred. No Windows/Docker modifications. No new Auth access, schema CREATE, table ownership or BYPASSRLS.

The correction enables only Storage name resolution in the disposable fixture; RLS still controls object access. Runtime assertions were prepared to independently verify this after the grant. Application grants/migrations remain byte-for-byte unchanged.

## 6. Remaining functionality and verdict

Operational person-identity case creation, subject-bound document reservation/finalization, reviewer assignment/decision, approval provenance enforcement, replay/version/concurrency handling, expiry/revocation, audit/status and retention remain future implementation work. No real KYC collection or booking/publication gate is activated.

**READY for separately authorized controlled CI execution; NOT YET CERTIFIED. NO-GO for declaring final closed-foundation certification or moving past its required gate to operational identity-lifecycle implementation.** If both jobs genuinely pass, that supports beginning the first local identity lifecycle, not real document collection or deployment.

Request explicit authorization to commit/push ONLY the three reviewed test files to `codex/database-certification` / PR #1. No automatic further correction push is included.
