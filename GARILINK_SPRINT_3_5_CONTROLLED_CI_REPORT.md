# Sprint 3.5 — media RPC repair and closed-foundation certification

2026-10-14, Africa/Dar_es_Salaam. Definitive isolated CI result: SUCCESS. Scope: canonical SQL regression and CLOSED progressive-verification foundation, not operational/production KYC.

## 1. Authorized commit

- Repository: `dreykendrick/GariLink`; branch `codex/database-certification`; existing PR #1, unmerged.
- Remote baseline reconfirmed before commit: `23f7111b314c76e2671fb5dd54aaebcbb4795430`.
- Commit: **`bc908897d89d55017d27c16e66e478c5b37e71fe`**.
- Only three authorized files: `supabase/migrations/20261014000000_vehicle_media_constraint_qualification.sql`, `supabase/tests/media-assertions.sql`, `supabase/tests/media-constraint-repair.test.mjs`.
- 156 insertions / 2 deletions. No reports, logs, product files or historical migrations committed.

## 2. Workflow and final jobs

[Run 38543808369](https://github.com/dreykendrick/GariLink/actions/runs/38543808369), workflow run number 7, definitive conclusion SUCCESS.

| Job | ID | Conclusion |
| --- | --- | --- |
| postgres-logic | 115784792500 | SUCCESS |
| supabase-platform | 115784792234 | SUCCESS |

Both monitored to completion. No additional fix, commit, push, rerun or PR merge performed.

## 3. Migration execution counts

- PostgreSQL/PostGIS logic: **34 canonical migrations executed**, including the forward-only media repair, before assertions.
- Actual disposable Supabase startup: **34 applied**.
- Actual disposable Supabase clean local reset/replay: **34 applied again**.
- Platform logs contain **68 migration applications (34 + 34)**.
- Logic transaction reached explicit **ROLLBACK**, then container teardown succeeded. The test transaction did not commit fixtures/schema changes. No separate post-rollback schema inventory query was executed.

No hosted database, production migration history or developer database modified.

## 4. Actual SQL suite outcomes

| Stage | Result / actual evidence |
| --- | --- |
| Request-actor helper | PASS; all helper assertions completed before identity marker |
| Identity | PASS SQL SUITE: identity |
| Workspace | PASS SQL SUITE: workspace |
| Marketplace | PASS SQL SUITE: marketplace |
| Rental | PASS SQL SUITE: rental |
| Pricing | PASS SQL SUITE: pricing |
| Media | PASS SQL SUITE: media |
| Email-auth | PASS SQL SUITE: email-auth |
| Closed verification, stand-in | PASS SQL SUITE: verification-closed |
| Transaction | ROLLBACK reached |

All seven required authorization suites genuinely executed. Seller-management assertions remain outside the seven-suite runner and were not separately executed; no claim is made for that suite.

## 5. Media repair runtime results

The migration operates on effective catalog definitions after email-first transformations, qualifying only the existing deferrable constraint command. Its runtime guards confirmed unchanged argument names/types/modes/defaults, return type, SECURITY DEFINER, restricted empty search_path, ACLs and ownership, and exact single-command body replacement. No function DROP, grant expansion, constraint relaxation or historical rewrite.

Media SQL suite actually executed and passed:

- Final catalog bodies use `public.gl_vehicle_media_position_unique` and retain email-first preparation workspace/session guards.
- Authenticated owner reservation, Storage metadata insertion and photo finalization.
- Reorder two ready photos; exactly one cover and unique contiguous positions.
- Force deferrable unique constraint IMMEDIATE after reorder; no invalid duplicate positions survive.
- Duplicate and missing media IDs rejected.
- Cross-workspace reorder, deletion, reserve, delete-ticket and Storage insertion denied.
- Raw media-table access denied; private KYC upload/direct privileges remain denied.
- Authorized cover deletion; remaining image compacted to position zero and became cover.
- Forced IMMEDIATE constraint check after delete; explicit duplicate-pair check passed.

Business RPCs stayed under authenticated application roles. Explicit administrator setup/read-only integrity checks were separate and audited. The prior constraint lookup failure did not recur; no new causal failure occurred.

## 6. CI Node regression and local preflight

CI Node: **123 tests executed / 123 passed / 0 failed**, step SUCCESS. This is actual CI evidence, unlike prior skipped Node steps. Final local preflight independently returned 123 passed / 0 failed/cancelled/skipped / exit 0.

Pre-push audits: 34-migration signature errors empty; fixture-role errors empty; 609 composed SQL AST statements with bounded BEGIN/ROLLBACK; read-only workflow validation PASS; exact staged allowlist/whitespace review PASS; credential-pattern scan 0 matches. Static results are not substituted for the executed SQL results above.

## 7. Real Supabase / Auth / Storage evidence

All real-platform stages SUCCESS: startup/replay, PostgreSQL/PostGIS/schema/RLS/RPC smoke, local Auth health, closed-verification rollback SQL, HTTP boundary assertions and shutdown.

Actual log markers:

```text
PASS: local Supabase Auth health (not email/token lifecycle certification)
PASS REAL PLATFORM CLOSED VERIFICATION SQL
PASS: real closed-platform boundaries; 65 assertions; 2 controlled email sessions; synthetic objects and accounts cleaned
Stopped supabase local development setup.
```

**65 executed / 65 passed / 0 failed** at the repaired commit. Two controlled confirmed-email accounts signed in through normal email/password, and session identities were checked before negatives. No service-role credentials were used for end-user negative requests.

Verified closed boundaries: anonymous/no-session advisory denial; inactive policy/collection and null allowed status; invalid-action rejection; safe advisory keys; private table ACL/RLS and REST exposure denial; unknown requirement scope/inactive-policy constraints; no frontend approval/reviewer self-assignment; known private object's upload/overwrite/read/sign/delete denial; unchanged synthetic fixture contents. Administrative context only provisioned controlled local fixtures, independently checked integrity and performed cleanup.

Private REST schema denial is an exposure boundary; it does not establish future applicant/reviewer row-scoped privileges. The valid one-pixel PNG was synthetic, not an identity document. Closed denials are not certification of an accepted upload/review lifecycle.

## 8. Cleanup / safety

- Logic suite reached ROLLBACK; disposable PostgreSQL containers stopped successfully.
- Real closed-verification SQL completed PASS then ROLLBACK.
- HTTP stage's finally cleanup removed all touched synthetic paths through Storage API, verified absence, and deleted both controlled Auth accounts before the PASS marker.
- Real Supabase teardown SUCCESS.
- Logs sanitized and saved under `ci-evidence/38543808369/postgres-logic.log` and `ci-evidence/38543808369/supabase-platform.log` in this certification worktree.
- Dirty product worktree preserved and untouched. This new report/evidence is local and uncommitted, not part of another push.
- No hosted Supabase/Auth changes, deployment, Edge changes, real KYC collection, gate activation, subscriptions, release, Windows/Docker changes or merge.

## 9. Remaining security / certification gaps

No new demonstrated authorization defect in this run. This success does not establish overall production readiness.

Still outside certification: operational identity case/submission/review APIs, valid-byte/malware/ownership validation for accepted evidence, scoped reviewer access, immutable decision transition enforcement, expiry/revocation/concurrency, signed-access lifetime, approved retention/deletion/legal-hold policy, identity-document fraud assessment, driver/fleet/delegation/custody workflows, actual booking/publication KYC enforcement and production Auth/email delivery/deep links. Seller-management suite remains unexecuted separately.

The stand-in Auth schema is a logic fixture, not real Auth emulation. The real-platform checks prove two ordinary email sessions and closed boundaries, not every Auth refresh/recovery/legacy lifecycle or a live reviewer operation.

## 10. Verdict and next sprint

**Closed progressive-verification foundation plus the required canonical SQL/Auth/Storage regression: CERTIFIED for this isolated CI scope at bc908897d89d55017d27c16e66e478c5b37e71fe.** Both jobs passed completely; no first causal error to report.

**GO for Sprint 3.6 — Person-Identity Verification Lifecycle, local implementation only.** Scope one identity lifecycle: subject-derived case creation, versioned private evidence reservation/finalization/submission, explicit trusted reviewer assignment, immutable approval/rejection, idempotency/replay protection, expiry/revocation, audited status retrieval and server-authoritative eligibility. Preserve independent tenancy/contact/vehicle/availability gates. Build and certify accepted-evidence/reviewer/retention controls before allowing real documents; do not automatically activate booking/publication KYC or deploy this repair to hosted Supabase.

Stop here after reporting certification. No next-sprint code was started.

SPRINT 3.5: COMPLETE
