# Sprint 3.2 — closed KYC certification preparation

2026-10-12. LOCAL PREPARATION COMPLETE; DATABASE / REAL PLATFORM CERTIFICATION PENDING AUTHORIZATION.

Sprint 3.3 preflight update: the reviewed 14-file scope is unchanged, but HTTP test quality was strengthened locally. Current planned HTTP count is **65**, superseding Sprint 3.2's 53. No real integration result is claimed; see section 11.

## 1. Existing CI fixture correction

Reviewed the seven-suite runner, simulated Auth/storage schemas, role audit and current dirty product branch. Four actor assertions in rental (two), pricing and media incorrectly called `auth.uid()`/`auth.jwt()` directly under the authenticated role. Replaced them with an invoker-only temporary `request_actor_matches(expected_sub,expected_session)` helper. It checks exact role, string sub/session values from `current_setting('request.jwt.claims',true)`, rejects absent/non-object/malformed claims and never logs claims. No Auth schema USAGE or additional grants were added. Server RPCs, authorization helpers and direct-write rejection tests are unchanged.

Prepared assertion-helper self-tests cover administrator masquerading, exact actor/session success, wrong subject/session and empty/malformed/null/array/object/non-string claims. Scanned all eight assertion files for equivalent direct Auth helper calls; none remain. These are checks of a simulated fixture, not proof of real Auth behavior.

## 2. Foundation security review

The new migration remains LOCAL and unexecuted. Six verification tables stay in the revoked private schema with RLS enabled and no client/service-role CRUD grants. No frontend approval or reviewer-assignment write API exists. Documents never enter public vehicle/rental serializers. Approval containers have provenance/expiry fields; decision/audit updates/deletes are rejected by append-only triggers. Requirement scopes are allowlisted; approved policy is prohibited by a constraint.

The private bucket is nonpublic, limited to 5 MiB and JPEG/PNG/PDF. The restrictive closed policy intersects permissive Storage policies and denies end-user access to that bucket. Existing vehicle-media bucket/policies remain unchanged. Admin/service credentials are still privileged infrastructure, not safe end-user credentials; no end-user negative uses them.

The advisory RPC requires an active confirmed session and exposes only action/proposed keys/version/evaluation time and inactive flags. `allowed=null` is NOT approval. Publication/rental policies are NOT activated or replaced. Membership, contact confirmation, availability and future entitlements remain independent. No operational lifecycle or reviewer/upload service is certified or claimed.

## 3. Prepared isolated CI changes

`postgres-logic`: retains all seven authorization suites in order, adds request-actor helper tests and a separately logged `verification-closed` suite. BEGIN/PASS markers are executed SQL, so a PASS marker is reached only if preceding statements succeed with psql ON_ERROR_STOP. Canonical migration discovery now requires the closed foundation migration in addition to email-first. All SQL remains inside one disposable BEGIN/ROLLBACK transaction; database is fixed loopback `5433/garilink_dev`, execution requires existing GitHub/disposable flags. No developer/hosted connection added.

`supabase-platform`: preserves clean local replay and existing smoke/health checks; adds real-platform rollback SQL and an HTTP Auth/Storage boundary script. SQL uses actual Supabase schemas/policies, not the stand-in. A permitted administrator creates only synthetic Storage metadata inside rollback; no identity bytes are seeded. Negative SELECT/UPDATE/DELETE runs under authenticated role. Real Supabase may deny direct SQL Storage deletion through its protection trigger: that denial is accepted, the trigger is never disabled, and the metadata row must remain intact.

HTTP stage accepts only `http://127.0.0.1:54321`, reads ephemeral CLI status in memory and requires GitHub execution plus the explicit disposable KYC flag. Creates two disposable confirmed-email users using legitimate local admin tooling, authenticates each through normal email/password, and rechecks live identity before negative tests. All advisory/REST/Storage negatives use ordinary sessions and the anon API key, NOT service-role credentials. The ephemeral admin credential is used only for account/resource fixture setup, independent fixture integrity checks and cleanup. No emails/SMS, real documents or hosted writes. Passwords/tokens/response bodies are never logged or written to files. A valid synthetic one-pixel PNG is seeded in the confirmed private bucket; its bytes/hash are checked before and after negatives. New uploads must yield classified RLS/privilege denial. Known-object overwrite/read/sign/delete must deny access or conceal the independently proven existing object; deletion may return zero removed objects, but admin verification must prove the original remains unchanged. All touched synthetic paths and users are cleaned in finally; any cleanup failure fails certification. Runner teardown remains always enabled.

The workflow retains read-only contents permissions, pinned actions, exact npx Supabase version, isolated jobs and no production secrets. No CI run triggered locally.

## 4. Prepared verification tests

| Boundary | Prepared evidence | Limits |
| --- | --- | --- |
| Anonymous / no active session | SQL function ACL and no-session execution denial; actual anonymous RPC HTTP denial | Real platform execution pending |
| Private tables | RLS and all CRUD ACL checks for anon/authenticated/service_role; actual SELECT and self-assignment/approval rejection | Closed-all access, not future applicant/reviewer row-scoped access |
| Cross-user / workspace coworker / purported reviewer | Two different simulated actor claims denied private table reads/writes; two real users denied private REST schema access | No operational workspace/reviewer grants exist; cannot certify future delegation |
| Private bucket / collection | Bucket constraints and restrictive-policy checks; authenticated INSERT denied | No validated upload lifecycle |
| Existing object read / overwrite / delete | Synthetic metadata row seeded as admin; authenticated SELECT invisible, UPDATE/DELETE denied; row retained | SQL metadata, not real blob storage lifecycle |
| Actual Storage service | Valid synthetic PNG; confirmed bucket; known-object read/overwrite/sign/delete denial; admin content recheck and API cleanup | Signed-link lifetime, accepted uploads and operational document lifecycle not certified |
| Invalid action | Normal-session unknown/null action yields 22023/400 | Requires real Auth session; real execution pending |
| Unknown scope / inactive policy | Administrator unknown scope INSERT and policy activation UPDATE rejected by constraints | All requirements are unapproved policy definitions |
| No accidental approval | Real advisory must return null allowed and both flags false; direct approval denied | No review decisions are applied |
| Privacy | Real advisory keys allowlisted; private schema unavailable through REST | Full future evidence DTO review still required |

The current HTTP orchestrator prepares 65 assertions against two normal email sessions, superseding the initial 53. Its mock orchestration tests validate fail propagation, target guard, ordinary-session use and cleanup only. They are NOT the 65 real integration assertions passing.

## 5. Local checks

| Check actually executed locally | Result |
| --- | --- |
| Full Supabase `npm test`, final rerun | 112 passed; 0 failed/cancelled/skipped; definitive exit 0 |
| Migration function-signature AST audit | 33 migrations; errors empty; exit 0 |
| Fixture role AST audit (now includes closed verification) | Errors empty; exit 0 |
| Request-actor + verification assertion SQL AST parse | 32 statements; exit 0 |
| Full `run-ci-sql.mjs --print` composition + SQL AST parse | 593 statements; 248835 characters; BEGIN/ROLLBACK boundaries checked; exit 0 |
| Workflow YAML checks | Parsed; two jobs, read-only permissions and explicit disposable KYC flag verified; exit 0 |
| Targeted 14-file credential-pattern scan + manual review | 0 JWT/private-key/GitHub-token/Supabase-secret-pattern matches; only explicit disposable/mock credentials present; exit 0 |
| Targeted Git diff whitespace check | Exit 0; existing LF/CRLF warnings only; staging remains empty |
| SQL/RLS assertions in a database | NOT EXECUTED |
| Real Supabase Auth/Storage 53-assertion orchestration | NOT EXECUTED; local orchestration mocks passed only |
| GitHub Actions | NOT TRIGGERED; awaiting explicit commit/push authorization |

SQL AST parsing does not execute function bodies, trigger behavior, RLS, Storage API or security assertions. No executed local check failed in the final preflight.

Flutter files were inspected but not edited in this sprint. Sprint 3.1's 238/238, clean analyzer/formatter remain historical results, not newly executed Sprint 3.2 results. No Flutter regression was required for these test-harness-only changes.

## 6. Exact reviewed remote batch (14 files)

1. `.github/workflows/database-certification.yml`
2. `supabase/migrations/20261012000000_verification_closed_foundation.sql` (existing uncommitted Sprint 3.1 foundation; required to replay 33)
3. `supabase/tests/identity-fixture.sql`
4. `supabase/tests/rental-assertions.sql`
5. `supabase/tests/media-assertions.sql`
6. `supabase/tests/pricing-assertions.sql`
7. `supabase/tests/run-ci-sql.mjs`
8. `supabase/tests/audit-fixture-roles.py`
9. `supabase/tests/request-actor-assertions.sql`
10. `supabase/tests/verification-closed-assertions.sql`
11. `supabase/tests/platform-verification.sql`
12. `supabase/tests/platform-verification.mjs`
13. `supabase/tests/verification-certification.test.mjs`
14. `GARILINK_SPRINT_3_2_FOUNDATION_CERTIFICATION.md`

Exclude every Flutter/product file, generated backend/dist, prior reports/evidence/assets and Sprint 3.1 presentation work. No changes to deployed/historical migrations, application Edge functions or working-tree branch history. No files staged/committed/pushed.

## 7. Safe Git integration and remote plan

Local product and certification branches both currently resolve to `65f312cf62fb7a366b2c056e2d05c5ea07761e1e`; product branch is dirty. Origin tracking of the certification branch is at that same known head; it was not fetched/verified against live GitHub in this preparation task. Main local/tracking points to `f7b1ede`. Keep current working tree intact.

AFTER authorization: first read/fetch the current remote PR head and confirm no intervening change. Use a clean separate worktree at the verified certification branch head. Materialize only the 14 reviewed files there, compare exact diffs, run preflight, stage that explicit allowlist, commit and push to the existing certification branch / PR #1. Do not merge, reset, clean or cherry-pick dirty product work. If the remote head changed, inspect before integration. Do not create another product PR or duplicate the KYC migration.

The authorized first run must log the exact SHA/run/jobs, 33 migration execution/replay, PASS markers for all seven suites and closed verification, existing real smoke checks, real closed SQL and 65 HTTP assertions plus cleanup. Any failure stops certification at the earliest causal error; no weakening or further push without authorization.

## 8. Outstanding issues / readiness

READY for a separately authorized first isolated CI execution; NOT CERTIFIED until actual PostgreSQL/PostGIS and real Supabase job logs return success. No local isolated SQL environment was started or altered. Local Docker/Windows servicing remains out of scope.

No functional reviewer service, approved compliance/retention policy, applicant-authorized document reserve/finalize, malware/content verification, scoped reviewer evidence access, signed URL expiry, revocation propagation, lifecycle concurrency or transactional booking/publication gate exists yet. Closed REST denial is not proof of future scoped access. No production-ready KYC claim, gate activation or subscriptions implementation.

## 9. Next feature: one person-identity lifecycle

Implement identity only after this closed replay/boundary certification, as additive local migrations and narrow RPCs. Keep real collection and booking/publication enforcement disabled until separately certified.

1. **Create case:** derive confirmed active subject from session; accept only identity scope and an idempotency key. Same key/same allowlisted payload returns same case; changed payload conflicts. Workspace/vehicle/driver claims are not accepted in this first lifecycle.
2. **Reserve document:** own editable case, expected revision and opaque random path; bind subject/case/version, allowlisted size/MIME and short reservation expiry. Do not accept an arbitrary existing object path. No signed access merely from path knowledge.
3. **Finalize/submit:** verify actual owner/path/bytes/hash/MIME/content checks; lock exact case revision; require validated required evidence. Mutation transaction makes DRAFT to PENDING_REVIEW and immutable audit once. Repeat exact submission is idempotent; edited evidence requires a new revision.
4. **Assign reviewer:** trusted administrative RPC checks designated reviewer authority and subject/reviewer separation; finite case-scoped assignment with grantor/expiry/revocation. Clients cannot self-assign or use workspace role as reviewer authority.
5. **Decide:** lock current pending version and active assignment; authorize reviewer; pin validated document versions and policy version; append approval/rejection with safe reason, approved expiry and audit in one transaction. Same decision key/payload returns original; changed payload conflicts. Invalid/revoked/expired assignment or stale version denies.
6. **Expiry/revoke:** evaluate expiry over requested action period on every decision use; no cron delay grants privilege. Trusted scoped revocation appends provenance/audit and supersedes eligibility immediately. Rejection/resubmission versions remain retrievable; never overwrite old decisions.
7. **Status retrieval:** own subject receives safe requirement state/reason/expiry/policy revision only; no raw numbers/documents/reviewer details in public marketplace DTOs. An assigned reviewer gets only scoped evidence through audited short-lived access.
8. **Action eligibility:** first implement a private person-identity evaluator binding actual actor and policy context. Identity approval alone NEVER grants rental/publication rights: existing contact, tenancy, capability, category/media, availability, dates/pricing and future class/insurance gates remain composed independently. Activation requires atomic rechecks in every relevant mutation path and a separately approved legacy rollout.
9. **Certification:** actual normal Auth users/reviewers; own/other subject reads/writes; reserve/finalize/replacement/replay/expiry/revocation races; invalid file/ownership/path attacks; immutable audit; signed access/retention/deletion. Synthetic evidence only. No driver/fleet/custody expansion in this first lifecycle.

## 10. Authorization boundary

Request explicit authorization to commit and push ONLY the 14-file reviewed certification batch to `codex/database-certification` / PR #1, triggering its two isolated jobs. Authorization does not include hosted deployment, another correction push, PR merge or product work. Until then all remote execution remains unperformed.

## 11. Sprint 3.3 preflight and authorization checkpoint

Live read-only GitHub metadata confirmed PR #1 open/unmerged, targeting main, with head `codex/database-certification` at `65f312cf62fb7a366b2c056e2d05c5ea07761e1e`. `git ls-remote` independently confirmed the same head. No remote write occurred.

A separate worktree was created at `C:/Users/kibaj/Documents/Codex/2026-09-06/i-x20/work/GariLink-ci-kyc-certification` on the certification branch. The managed-app worktree attempt could not validate its starting ref; explicit Git worktree creation used the verified repository/ref instead. The dirty product branch was not checked out, reset, cleaned or staged. Only the 14 allowlisted files are transferred for review.

HTTP test-quality discrepancies found and fixed locally: broad status-code acceptance; nonexistent object reads; an invalid initial PNG chunk CRC. The prepared stage now checks bucket existence/privacy/MIME/limit, valid PNG CRC/content, exact session identity, explicit PostgREST schema/privilege denial and Storage RLS/access-denial codes/messages. Unrelated invalid MIME, missing bucket, invalid JWT and service unavailable errors fail certification. Concealed not-found is acceptable ONLY for the exact fixture whose existence/content is independently checked using administrative context. Unexpected accepted uploads fail and are included in cleanup. Cleanup errors fail the stage. No actual real Auth/Storage request was performed locally.

Final clean-worktree preflight:

| Executed check | Result |
| --- | --- |
| `npm ci` | 3 packages installed, audit 4 packages, 0 vulnerabilities, exit 0 |
| Full `npm test` on final candidate | **120 passed**, 0 failed/cancelled/skipped, definitive exit 0 |
| Signature AST audit | 33 migrations, compatibility errors empty, exit 0 |
| Fixture role audit | Errors empty, exit 0 |
| Complete SQL AST composition | 593 statements, 248802 characters in this worktree, bounded BEGIN/ROLLBACK, exit 0 |
| Workflow YAML | Two jobs, read-only permissions and disposable KYC flag checked, exit 0 |
| PNG syntax/content | Chunk CRCs, one-pixel dimensions and decompressed RGBA content validated by regression test |
| Targeted secret review / staged-diff review | Exact 14-file allowlist; no production secrets or unrelated files; review performed before commit |

PNG CRC validation initially detected a defective synthetic fixture; replaced with a valid 68-byte generated white pixel and added a regression assertion. All final preflight checks pass. This was a test-fixture correction, not an application/migration defect. Cleanup now preserves the earliest causal failure even if resource cleanup also fails; its regression is included in 120.

Planned real HTTP total: **65**. Historical 53 is not a passed result. Commit SHA/run URL/job IDs remain **NOT CREATED / NOT EXECUTED** pending separate explicit commit/push authorization. All seven suites, request-actor and closed-KYC database outcomes remain **NOT EXECUTED** for this batch. Seller-management assertions remain outside the seven-suite runner and have not been separately executed.

The certification worktree's index contains only this 14-file batch for review; the original product worktree's index remains untouched/empty. No commit or push occurred; neither branch head changed. Stage authorization is not deployment/push authorization.

Next feature scope remains section 9's single person-identity lifecycle; no operational KYC, driver/fleet/custody or billing expansion is authorized by this preparation.
