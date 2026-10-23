# Sprint 3.6 — person-identity preparation vertical slice

2026-10-14. PARTIAL LOCAL IMPLEMENTATION. Operational applicant → validated evidence → trusted reviewer lifecycle is NOT complete or certified.

## 1. Git baseline and preservation

Created local branch `codex/person-identity-lifecycle` in separate worktree `GariLink-person-identity`, exactly from certified commit `bc908897d89d55017d27c16e66e478c5b37e71fe`. No remote Git operation, commit/push, PR modification or hosted operation. Certified PR #1/worktree and dirty `codex/renter-owner-journeys` worktree unchanged.

Explicitly imported ONLY six reviewed verification files from the dirty product worktree: two domain files, checklist/action-preview widgets, and their two tests. Destinations did not exist; no overlap was overwritten. Checklist gained an optional notice, preserving its old default API/text. No generated backend/dist, Home assets, auth/journey implementation or reports copied.

Router/Profile additions are made against the certified baseline, NOT applied over the dirty product router. Later integration must preserve that router's booking continuation and add the debug route/guard deliberately; it requires a reviewed merge and regression of the original 238-test product suite. No claim that this isolated branch incorporates those uncommitted journey improvements.

## 2. Reused versus missing

Reuses six private verification containers, requirement definitions, private bucket, restrictive collection-denial policy, immutable decision/audit triggers, active confirmed-session helper, shared checklist/status components, existing API client/Auth routing and canonical CI tests.

Missing and deliberately closed: accepted evidence transport/validation, malware scanning, trusted reviewer administration/access/decisions, atomic submission/approval transitions, revocation RPC, retention/deletion approval, and production action enforcement. No competing state tables or general onboarding KYC introduced.

## 3. Database and RPC changes

New final additive migration: `20261014010000_person_identity_preparation.sql`; canonical chain becomes **35**, not historical 34.

Existing cases gain policy-version/creation-payload snapshots and a private monotonic case ordering sequence, with sequence privileges revoked from clients/service role. A partial unique index permits at most one active identity case per subject. No existing grants/RLS/Storage policy is broadened.

- `public.garilink_identity_create_case(input_value jsonb)`: confirmed active session derives subject; allowlist requestId/policyVersion only; validated UUID/integer; per-account row lock serializes creation; exact replay returns same case; conflicting key/input or another active case returns PT409; known PERSON policy required; creates DRAFT plus one audit event atomically. No arbitrary subject/workspace/driver/vehicle/status input accepted.
- `public.garilink_identity_status()`: no actor/case identifier input; returns only the authenticated subject's latest identity case, selected by private sequence. Safe fields only: case/state/revision/policy version, expiry, missing-step list, closed collection/ineligible flags.
- Private `identity_case_summary(c)`: not executable by ordinary clients. Defensive approved-record projection checks decision/evidence/policy scope, expiry and any immutable revocation. Missing provenance does not display approval. This is not an operational reviewer decision engine.

All functions have explicit SECURITY DEFINER/empty search_path boundaries; authenticated gets only the two public preparation RPCs. Service-role and anonymous execution revoked; raw private tables remain inaccessible. No new table or frontend approval boolean.

## 4. Applicant behavior and version policy

Working local code path: confirmed actor → own missing status → idempotent DRAFT creation → audit → fresh own status. Creation keeps revision 1; case families are ordered by private insertion sequence, independent of transaction-start timestamps. Account row locking plus unique index handles competing active creations by rejection, not duplicate drafts. Concurrency has not executed in a database yet.

Rejected/expired/revoked historical containers are not overwritten. A new case can only be created when no active state exists; full resubmission is not implemented and the response advertises resubmissionAvailable=false. An APPROVED row whose expiry is only projected EXPIRED still blocks new creation until a future trusted transition service materializes that lifecycle change. This limitation is explicit, not silently treated as working resubmission.

## 5. Evidence workflow

NOT IMPLEMENTED: reserve/upload/finalize/replace/submit. Private bucket still denies ordinary users and collectionEnabled=false is server-authored. No bytes, identity numbers, signed URLs or document paths accepted/returned by new routes.

Do not treat metadata state VALIDATED as a new validated-upload service: only the certified closed container exists. A future accepted path must verify actual ownership/path/size/hash/signature and approved malware/content safety; fail closed when scanner unavailable. No provider, legal document list, retention period or fraud-detection claim invented.

## 6. Reviewer assignment/decision

NOT IMPLEMENTED. Existing assignment/decision tables and immutable history are reused but remain closed. No self-assignment endpoint, admin claim, reviewer UI, approve/reject RPC or reviewer document access added. No DRAFT-to-PENDING_REVIEW/APPROVED transition is available to the applicant. These stages cannot be reported operational.

## 7. Expiry/revocation

Read-side defensive projection exists for authoritative private records: expired approval projects EXPIRED; any revocation for the same case projects REVOKED even if an old approval is replayed; incomplete provenance does not project APPROVED. No revocation/expiry state-mutation service or audited reviewer authority is implemented. These branches are NOT independently SQL-certified. Eligibility remains false regardless of projection while policy is inactive.

## 8. Flutter integration

Debug-only `ENABLE_IDENTITY_PREPARATION` flag defaults false and is compiled off in product builds. When enabled locally, authenticated Profile has an identity preparation entry and a protected route.

Server-backed overview loads safe status, explains collection/review unavailability, creates a private draft and refetches status. One in-memory random UUID retry key persists across failed save retries; actor-keyed widget state resets on account changes. Technical errors are replaced with safe retry copy. Existing checklist reused with a clear server-preparation notice rather than pretending preview fixture data is server data.

Pending/approved/rejected/expired/revoked display mappings are tested with explicit fake repositories. They do not simulate production approval. The parser rejects responses attempting to enable collection or eligibility for this slice. No upload picker, reviewer action, automatic booking/publication or signup gate exists. No changes to authentication, Home or owner/fleet logic.

## 9. Server eligibility contract

Current own-status contract reads authoritative case data but intentionally **always returns eligible=false, reasonCode=POLICY_NOT_ACTIVATED**. A fully activated action-period identity evaluator is NOT implemented. This avoids pretending identity approval grants rental/publication permission.

Future policy must bind actor, evidence/case/policy revision and requested period, then compose independently with Auth/contact, tenancy, vehicle authority, availability, driver eligibility, dates/pricing, publication readiness and future entitlements. Recheck inside every protected mutation transaction, not only through Flutter or an advisory response.

## 10. Files changed/new

Modified: `supabase/functions/garilink-api/handler.ts`; `supabase/tests/run-ci-sql.mjs`; `supabase/tests/audit-fixture-roles.py`; `mobile_flutter/lib/core/navigation/app_router.dart`; `mobile_flutter/lib/features/profile/presentation/pages/profile_page.dart`.

New: migration above; `supabase/tests/identity-preparation-api.test.ts`; `supabase/tests/identity-preparation-assertions.sql`; `mobile_flutter/lib/features/verification/data/identity_repository.dart`; `mobile_flutter/lib/features/verification/presentation/identity_preparation_page.dart`; `mobile_flutter/test/identity_preparation_test.dart`.

Imported/reused: `verification/domain/verification_requirement.dart`, `verification/domain/verification_decision.dart`, `verification/presentation/verification_checklist.dart` (optional notice added), `verification/presentation/verification_action_preview.dart`, `test/verification_checklist_test.dart`, `test/verification_decision_test.dart`. This report is also new. No staged/committed batch yet.

## 11. Actual local verification

Full suite counts refer to this isolated certified-baseline branch, not the untouched dirty product branch. Imported verification tests and new identity tests are additions; no existing test was deleted or weakened.

- Supabase Node regression: **126 passed, 0 failed, 0 skipped, 0 cancelled; exit 0**.
- Function-signature AST audit: **35 migrations; 0 compatibility errors**. SQL composition: **642 statements**. These are static checks, not migration execution.
- Focused Flutter verification tests: **24 passed; exit 0**.
- First complete `flutter test --no-pub`: **213 passed; exit 0**. Subsequent changes were brace/style fixes only.
- Final `flutter analyze --no-pub`: **No issues found; exit 0**.
- `dart format --set-exit-if-changed lib test`: **135 files, 0 changed; exit 0**.
- Final full Flutter rerun after style fixes: **unresolved**, last progress 192 passing tests; no final process result received. Do not certify this rerun as PASS or infer that it is a confirmed test deadlock. Compiler process remained present during inspection.
- `git diff --check`: **exit 0**. Nothing staged or committed.

Actual SQL/RLS execution and the final full Flutter rerun are NOT CERTIFIED. No remote CI or hosted operations occurred.

## 12. Prepared versus executed security tests

API mocks execute normal-token forwarding, anonymous denial and client impersonation/workspace/status/reviewer field rejection. Widget tests execute server-status presentation, fresh reload, retained retry key, hidden technical errors, no upload/action buttons and 320px/200% text. These do NOT certify PostgreSQL/Auth/Storage behavior.

Prepared disposable `identity-preparation-assertions.sql`: anonymous ACL and private-sequence denial; confirmed email-only applicant DRAFT creation; replay/conflict/active-case rejection; cross-account own-status isolation; no collection/eligibility/private fields; one audit event; direct approval denial; unconfirmed/no-session denial. Appended as its own logged stage AFTER all seven original suites and closed verification. Fixture-role audit includes the new suite. The existing real-platform 65 checks are preserved unchanged; they do not yet exercise new preparation RPCs.

SQL, real Auth/Storage and parallel-session creation assertions have NOT executed for the 35-migration branch. No CI triggered. Prior Sprint 3.5 results certify only bc90889's 34-migration CLOSED foundation.

## 13. Known unimplemented controls / risks

- Entire accepted-evidence and reviewer lifecycle absent; cannot advance a draft or obtain identity privileges.
- No malware scanner, content verification, reviewer short-lived evidence access or retention/deletion worker. Real collection prohibited.
- Partial status projection does not constitute approved policy/review provenance enforcement for a live service.
- New-case concurrency locks/index prepared but not runtime/concurrency certified.
- Foundation subject/document/audit foreign keys intentionally prevent naive Auth-account deletion once a case exists. An approved retention/account-deletion path and disposable real-Auth case-fixture cleanup are required before a real accepted lifecycle test; do not bypass audit immutability to clean production data.
- The unique active-case index must be preflighted against any future deployed case data; duplicate active legacy cases would abort migration rather than be destructively rewritten.
- Original dirty product integration and its full regression remain a separate reviewed step.

## 14. Remaining compliance/security gates

Approve versioned evidence/reviewer/retention policy with appropriate product/legal review. No assumed Tanzanian document categories, durations or insurer rules. Keep policy/collection/enforcement inactive until actual accepted-upload, scoped review, expiry/revocation and safe deletion controls are independently tested. No deployment, Auth configuration, real uploads or KYC activation authorized here.

## 15. Safe next certification plan

After separate Git/CI authorization: certify 35 clean migrations and existing seven + closed + preparation SQL suites in disposable infrastructure. Preserve old 65 real closed-boundary assertions. Add genuine normal-session preparation RPC coverage with a reviewed disposable cleanup strategy, and two-connection concurrency tests. Do not infer success from AST or prior CI. No push/PR #1 change occurred.

Then implement one accepted synthetic-evidence lifecycle with certified reservation/finalization/scanner boundary and explicit trusted reviewer authority; integrate real UI submission only after those controls exist. Do not activate production collection merely because preparation passes.

## 16. Vehicle/driver integration readiness

NOT READY. Finish and certify person-identity evidence/review/expiry/revocation first. Driver/fleet/vehicle/custody gates remain separate and must not use workspace roles or this private DRAFT as verification approval.

## 17. Subscription readiness / verdict

NOT READY for subscription implementation or claiming KYC completion. Billing/provider/prices/entitlements untouched. Safe independent subscription architecture can be planned later, but this pass does not satisfy the agreed KYC completion gate.

Small preparation vertical slice implemented; full Sprint 3.6 lifecycle remains incomplete. No operational completion is claimed.

SPRINT 3.6: INCOMPLETE
