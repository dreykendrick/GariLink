# Sprint 3.3 — controlled CI execution report

Date: 2026-10-12. Overall run: FAILURE. Real disposable Supabase closed-foundation checks: PASS. Full certification: INCOMPLETE.

## 1. Authorized commit and run

- Repository: `dreykendrick/GariLink`; existing PR #1, no merge.
- Remote baseline reconfirmed immediately before push: `65f312cf62fb7a366b2c056e2d05c5ea07761e1e`.
- Authorized commit: `e2dca8fe03aeb1bcf331ed2f93b3702e802c9be9`.
- Exactly the reviewed 14 files committed; 815 insertions / 11 deletions.
- Branch: `codex/database-certification`.
- Run: [38298277679](https://github.com/dreykendrick/GariLink/actions/runs/38298277679), workflow run number 5, final conclusion FAILURE.
- Logs use UTC. Platform job log spans 19:32:04–19:34:57 UTC. PostgreSQL causal failure is at 19:32:40 UTC.

## 2. Job conclusions

| Job | ID | Final conclusion |
| --- | --- | --- |
| postgres-logic | 114974599195 | FAILURE |
| supabase-platform | 114974599578 | SUCCESS |

Both jobs were monitored to definitive completion. No rerun, correction commit or second push occurred.

## 3. Migration execution and replay

PostgreSQL/PostGIS logic runner reported 33 canonical migrations. All migration statements and request-actor helper assertions completed before the first identity-suite marker. The later media failure aborted the disposable transaction; these are execution results, not permanently applied migrations.

Real Supabase startup and subsequent clean `db reset --local --no-seed` both succeeded. The platform log contains **66 migration applications: 33 at startup + 33 at clean replay**, including `20261012000000_verification_closed_foundation.sql` in both. No hosted database or hosted migration ledger was involved.

## 4. Seven SQL suites and helper checks

| Logic suite | Executed outcome |
| --- | --- |
| Request-actor helper | PASS; execution completed before first suite marker |
| Identity | PASS marker reached |
| Workspace | PASS marker reached |
| Marketplace | PASS marker reached |
| Rental | PASS marker reached |
| Pricing | PASS marker reached |
| Media | FAIL; started but no PASS marker |
| Email-auth | NOT EXECUTED after media failure |
| Closed verification, stand-in job | NOT EXECUTED after media failure |
| Node regression in CI | SKIPPED after SQL step failure |

Local final preflight had 120/120 Node tests passing; this is separate evidence and not a CI Node PASS. Seller-management assertions remain outside the seven-suite runner and were not separately executed.

## 5. Earliest causal failure

Step: `Canonical migrations and rollback SQL authorization assertions`.

At `supabase/tests/media-assertions.sql:11`, authenticated direct insertion of synthetic vehicle-media metadata failed:

```text
ERROR: permission denied for schema storage
LINE 1: insert into storage.objects(bucket_id,name,metadata) values(...
Process completed with exit code 3.
```

The stand-in `identity-fixture.sql` creates `storage` and grants authenticated table DML, but does not grant schema USAGE. The INSERT is therefore rejected at schema name-resolution authorization before its intended Storage RLS test. Auth-schema helper assertions no longer caused the earlier failure: rental/pricing and the media actor/reservation checks ran successfully.

Classification: **stand-in fixture privilege mismatch**, not a demonstrated application KYC/Storage authorization defect. PostgreSQL insufficient-privilege category; numeric SQLSTATE is not printed by these default psql logs. Do not claim an observed numeric SQLSTATE beyond the logged message.

Smallest proposed correction, NOT APPLIED: make the disposable Storage fixture faithfully represent the existing real platform's required authenticated schema-usage boundary while preserving all object ACLs, RLS and negative tests. Scope any reviewed fixture-only USAGE permission to `storage`, never Auth or production schema changes; do not grant object ownership, CREATE, reviewer rights, bypass-RLS or new application permissions. Validate it with explicit fixture ACL assertions and rerun the exact full chain after separate authorization. Do not move the media INSERT under administrator or skip the assertion.

## 6. Real platform SQL / health

The actual disposable Supabase job independently passed:

- Clean startup and migration replay.
- Existing PostgreSQL/PostGIS/schema/RLS/RPC-privilege smoke assertions.
- `PASS: local Supabase Auth health`.
- `PASS REAL PLATFORM CLOSED VERIFICATION SQL` at 19:34:35.861 UTC.

Closed SQL verifies the private bucket constraints; anonymous RPC denial; no-session denial; private table RLS/direct ACL restrictions; proposed-scope and inactive-policy constraints; two simulated subjects denied private reads/self-assignment/frontend approval; authenticated Storage insertion/read/overwrite/deletion denial; retained synthetic metadata. The tests ran against actual Supabase schemas/policies in a rollback transaction, not the stand-in schema. This does not certify future row-scoped reviewer access.

## 7. Real Auth / Storage HTTP results

At 19:34:37.667 UTC the actual platform log records:

```text
PASS: real closed-platform boundaries; 65 assertions; 2 controlled email sessions; synthetic objects and accounts cleaned
```

**65 executed / 65 passed / 0 failed.** Two controlled confirmed-email accounts authenticated through normal email/password flow; actor identity was validated before negatives. Ordinary-session/anon-key requests tested inactive policy responses, valid-action privacy, null/unknown action rejection, private REST schema/privilege denial, known private-object reads/overwrites/signing/deletion, and policy rejection of new uploads. Anonymous RPC/object requests were denied. Administrative context was used only for legitimate local fixture setup, known-fixture content rechecks and cleanup, not end-user negative tests.

The private bucket existed with its constraints before tests. A valid 68-byte one-pixel PNG, with no identity/customer content, established a known actual byte object. The fixture's content was verified before and after ordinary-user attempts. Broad 400/404/5xx failures were not accepted as authorization evidence; concealed object-not-found applied only to this independently proven existing object. Private REST schema denial is an exposure boundary, not proof of an operational reviewer permission model.

## 8. Cleanup evidence

- Closed-platform SQL reached PASS and then ROLLBACK; its synthetic metadata was not persisted.
- HTTP stage's PASS is reached only after finally cleanup succeeds: attempted synthetic paths removed through the Storage API and absence verified; both controlled Auth users deleted.
- `Stop disposable runner resources` SUCCESS; log confirms Supabase stopped at 19:34:56.733 UTC.
- PostgreSQL job's container teardown SUCCESS; aborted transaction ended with server/container shutdown.
- No real identity documents, production emails/SMS or hosted records created/deleted.

## 9. Security findings and limits

No genuine authorization vulnerability was demonstrated in this run. Actual closed-foundation denials passed, but incomplete logic-suite coverage prevents the required overall certification. Media/email-auth and stand-in closed-KYC remain unresolved/unexecuted, and CI Node regression skipped.

This is closed-foundation certification evidence only. It does not certify applicant uploads, document-byte validation/malware handling, scoped reviewer access/decisions, identity approval, expiry/revocation, retention/deletion policy, signed-link lifetimes, concurrency, delegated driver/fleet rights or custody. No booking/publication KYC gate was activated. Subscription work remains deferred.

## 10. Product and Git preservation

The separate certification worktree is clean after the one authorized commit/push. The original `codex/renter-owner-journeys` branch remains on its original head with all dirty renter/owner, booking continuation, verification UI, backend/dist, reports, assets and prior evidence preserved; its index remains empty. These new local report/log files are not committed or pushed.

No hosted Supabase/Auth/config changes, Edge deployment, PR merge, release, Windows/Docker modification or additional remote write was performed. PR #1 remains unmerged.

## 11. Evidence files

- `ci-evidence/38298277679/postgres-logic.log`
- `ci-evidence/38298277679/supabase-platform.log`

JWTs, key patterns, credential-bearing URLs and credential lines are redacted. GitHub retains the original unsuccessful run for independent inspection.

## 12. Decision and next scope

**NO-GO for declaring Sprint 3.3 fully certified or moving past its required certification gate into the operational identity lifecycle sprint.** First authorize the smallest fixture-only correction and its separate controlled CI rerun. Do not silently change permissions or push another correction.

Once the required full SQL suites and CI regression pass, the next feature remains one person-identity lifecycle: subject-derived case creation, versioned reserved evidence, authorized submission, explicit scoped reviewer assignment, immutable approval/rejection, idempotency/replay protection, expiry/revocation, safe status retrieval and audit. Keep real document collection and transactional booking/publication gate activation separately disabled until those behaviors are certified.

SPRINT 3.3: INCOMPLETE
