# Sprint 3.1 — progressive verification local foundation

Date: 2026-10-12. LOCAL IMPLEMENTATION ONLY; NOT KYC SECURITY CERTIFICATION.
No hosted changes, deployment, uploads, Git commit/push, Windows changes, or subscription work.

## 1. Architecture discovered

`GARILINK_PROGRESSIVE_VERIFICATION_AND_HANDOVER_ARCHITECTURE.md` is an architectural proposal, not a deployed trust engine. Authentication/contact possession, reviewed identity, operational availability, membership and future subscription entitlement are distinct. Existing email-first session checks and phone-required sensitive operations are preserved. Existing `gl_vehicles.is_verified` and account capabilities are NOT KYC approval.

Inspected identity/workspace foundations, final email-first RPC transformations, canonical function-signature inventory, booking/publication call sites, transport driver preferences, Auth routing/continuation, private schema privileges, vehicle-media policies, Edge bearer-token verification and proposed custody architecture. The Edge authenticates via Supabase `/auth/v1/user`; its service-role estimate use does not constitute document/reviewer authority.

## 2. Reused work and implemented/missing matrix

| Area | Before this pass | This pass | Still missing |
| --- | --- | --- | --- |
| Signup/account access | Email-first preparation and legacy phone support | Unchanged; no signup KYC | Hosted email-first/real Auth certification |
| Checklist | Presentation preview and draft scopes | Reused, added revoked; debug-only booking/publication entry points | Live case/status retrieval |
| Verification records | Proposal only | Closed private tables, FK/version/state constraints | Certified lifecycle RPCs and subject/requirement scope validation |
| Review authority | None | Private scoped-assignment/decision containers; no client CRUD | Admin assignment API, active reviewer checks, decision transaction/idempotency validation |
| Approval/audit | None | Provenance fields, expiry requirement, append-only decisions/audit | Atomic transitions, revocation propagation, audit emission, policy evaluation |
| Documents | None | Private bucket and restrictive end-user deny policy | Reserve/finalize APIs, byte/hash/ownership/malware validation |
| Action policy | Existing contact/readiness/tenancy checks | Advisory inactive-policy RPC; no action grants | Context/date/class-aware evaluator and transactional mutation enforcement |
| Resumption | Separate post-login vehicle-review continuation | Test-double fresh-decision boundary; no mutation retained/invoked | Live repository adapter and deliberate post-review form restoration |
| Drivers/fleets | Workspace roles, vehicle driver capabilities | Preserved; driver/person/vehicle associations reserved | Credential classes, assignments, delegated rights and real driver activation UI |
| Custody | Architecture proposal; rental lifecycle | Unchanged and disabled | Dual-party evidence/challenges/return workflow |

## 3. Requirement matrix

These are PROPOSED scopes, not Tanzanian legal conclusions or active policy. All definitions are marked unapproved; this migration prohibits setting them approved. Activation requires a separately reviewed migration and certified mutation gates.

| Action | Proposed minimum | Independent checks |
| --- | --- | --- |
| Browse/signup | No identity documents | Existing public visibility/Auth rules |
| Workspace/draft preparation | No document approval | Active confirmed account and tenant permissions |
| With-driver request | Renter identity/contact | Vehicle/mode/driver operations; no renter licence |
| Self-drive request | Identity/contact/designated receiver licence | Resolved mode, driver class/dates, vehicle insurance, pricing/requestability |
| Vehicle publication | Owner identity/contact, documents, ownership/mandate, applicable insurance | Membership/delegation, workspace legitimacy, category/media/readiness |
| Workspace authority | Identity/contact/workspace authority | Explicit operational responsibilities; not automatic reviewer rights |
| Driver activation | Identity/contact/licence/applicable qualifications | Workspace relationship and actual vehicle/service class/date eligibility |
| Assignment/handover | Current qualified actors and scoped authority | Booking state, parties, mode, dual-party custody protocol |

`ANY` remains a discovery preference, not a choice of weaker verification. The debug booking preview refuses to select a checklist until self-drive/with-driver is explicit. Operational mode resolution at the authoritative rental boundary remains future work.

## 4. Local backend contracts

Prepared additive `20261012000000_verification_closed_foundation.sql`; historical migrations untouched. Six private tables: requirements, cases, document metadata, reviewer assignments, decisions, audit. No grants to anonymous/authenticated/service-role clients and no permissive private-table policies. Cases bind subjects and optional driver/vehicle/workspace; composite FK prevents mismatched vehicle/workspace. Documents have unique case versions, opaque paths, allowlisted MIME/size/hash metadata, reservation and retention timestamps and deletion tombstones. Decisions bind the exact case/document/reviewer assignment, unique request IDs, reason codes, approval expiry; updates/deletes on decisions/audit fail through triggers.

These containers DO NOT implement an operational reviewer service: active assignment checks, version locking, allowed transition enforcement, exact subject ownership validation, audit emission and idempotent payload comparison must be implemented in narrow RPCs before granting access. Administrative database owners can still access data; RLS is not protection from administrators.

The sole new public RPC, `garilink_verification_requirements(action text)`, requires the existing confirmed active session. It returns proposed keys, policy version/time, `gateEnabled=false`, `collectionEnabled=false`, `allowed=null` and `POLICY_NOT_ACTIVATED`. It accepts no actor ID, document or approval claim. It does NOT authorize publication/rentals or serialize private records. Invalid/unknown actions are rejected. There is no Edge endpoint or Flutter adapter for it yet.

## 5. Storage security

Prepared private `verification-private` bucket, 5 MiB cap, JPEG/PNG/PDF allowlist. A restrictive policy blocks all end-user reads/inserts/updates/deletes for this bucket, including intersections with any permissive policies. Existing vehicle-media bucket/policies remain distinct and unchanged. No real or synthetic document bytes uploaded.

Private paths and metadata are not sufficient authorization. No signed-access endpoint, reviewer document access or upload finalization exists. No secure-deletion worker is enabled. Retention timestamps are controls to support future policy, not an approved retention period; deletion must use the Storage API and leave appropriate audit/tombstones. Signed URLs require short approved TTL, current actor/assignment authorization and audited issuance; previously issued URLs cannot be instantly revoked. Real Auth/Storage integration remains NOT CERTIFIED.

## 6. Flutter integration

Existing checklist/theme components reused, with revoked status. Debug-only `ENABLE_VERIFICATION_PREVIEW` remains false by default and compiled off in product builds. Publication and booking preview intercept immediately before their existing protected action path and stop; closing the sheet never submits/publishes. This is intentionally not a production gate. Signup, browsing, profile, owner drafts and ordinary enabled journeys are unchanged.

The fresh-decision source contract is test-double-only. `canReviewAfterVerification` rejects missing approval, pending/rejected/expired/revoked requirements, expired decisions and account switching/logout. It calls the source on every attempt, binds actor/subject/journey, catches failures as denied and returns permission to REVIEW only. It is not wired to execute actions or persist continuation. Authentication continuation remains separate. No credentials, documents, signed URLs or arbitrary routes enter navigation state.

## 7. Handover boundary

Preserved proposal: verified exact parties and scoped owner/agent authority; separate private custody photographs/condition/odometer/fuel; short-lived booking/evidence-bound challenge; two authenticated acknowledgements; immutable audit and return/check-in. Identity documents must not be shared with counterparties or mixed with condition photos. No handover collection/activation, delegation grant or rental lifecycle bypass was implemented.

## 8. Tests executed

| Command/check | Final result |
| --- | --- |
| Focused `flutter test --no-pub test/verification_checklist_test.dart test/verification_decision_test.dart` | 16 passed, 0 failed/skipped, exit 0 |
| Full `flutter test --no-pub` | 238 passed, 0 failed/skipped, definitive final exit 0 |
| `flutter analyze --no-pub` | No issues, exit 0 (53.0 seconds) |
| `dart format --set-exit-if-changed lib test` | 134 files, 0 changed, exit 0 |
| Supabase `npm test` | 107 passed, 0 failed/cancelled/skipped, exit 0 |
| `python tests/audit-function-signatures.py` | 33 canonical migrations parsed; compatibility errors empty; exit 0 |
| `node tests/run-ci-sql.mjs --print` | Composition exit 0, 239743 characters; NO database execution |
| PostgreSQL AST parse of prepared verification assertions | 12 statements parsed, exit 0; NO assertion execution |
| `git diff --check` | Exit 0; only existing line-ending warnings |
| SQL/RLS/Auth/Storage integration | NOT EXECUTED / NOT CERTIFIED |

An initial analyzer run found one missing-braces style issue in the publication hook; fixed and final analyzer rerun passed. No functional regression test was weakened/deleted. SQL parsing/composition and Flutter/Node tests do NOT prove executed database authorization. No historical CI result is counted as KYC certification.

## 9. Prepared SQL tests and certification gaps

`verification-closed-assertions.sql` is a separate prepared disposable-transaction suite: private bucket constraints, anonymous RPC privilege denial, authenticated advisory privilege, private-table RLS and no direct grants for three roles, end-user upload/read/overwrite/delete denial using synthetic metadata only. It is not appended to the currently blocked seven-suite runner, and has NOT executed. Run it after the canonical chain in an explicitly disposable transaction, never against developer/hosted data.

The existing stand-in Auth-schema fixture failure is unchanged: its assertion calls `auth.uid()` as authenticated without schema USAGE. Resolve that certification-track defect separately without weakening application grants. Real confirmed/unconfirmed/revoked-session users, reviewers, tenant attempts, expired/revoked credential decisions, direct mutation bypass, upload lifecycle and concurrent review/expiry/revoke are still untested. No isolated SQL environment was established during this task; no developer database or Docker/Windows configuration was touched.

## 10. Rollout and security gates

Do not deploy/enable this foundation as a complete KYC service. First approve evidence scopes, reviewer roles, licence classes/period rules, retention/legal hold and legacy transition policy. Implement narrow reviewed RPCs, then certify real Auth/Storage and concurrent authorization in isolated CI. Add context-bound transactional policy to ALL relevant legacy/V2 mutation paths, not only Flutter or Edge. Recheck eligibility in the transaction even after a fresh advisory response. Keep read/cancel/return operations available according to explicit policy and avoid prematurely locking existing users out. No client feature flag is a security barrier.

## 11. Files changed in this pass

- `supabase/migrations/20261012000000_verification_closed_foundation.sql` (new)
- `supabase/tests/verification-closed-assertions.sql` (new)
- `mobile_flutter/lib/features/verification/domain/verification_requirement.dart` (existing local preview extended)
- `mobile_flutter/lib/features/verification/domain/verification_decision.dart` (new)
- `mobile_flutter/lib/features/verification/presentation/verification_checklist.dart` (existing local component extended)
- `mobile_flutter/lib/features/verification/presentation/verification_action_preview.dart` (new)
- `mobile_flutter/lib/features/booking/presentation/pages/booking_page.dart`
- `mobile_flutter/lib/features/owner/presentation/pages/my_vehicles_page.dart`
- `mobile_flutter/test/verification_checklist_test.dart` (existing local tests extended)
- `mobile_flutter/test/verification_decision_test.dart` (new)
- This report.

## 12. Git safety

Stayed on `codex/renter-owner-journeys`. Preserved all dirty renter/owner/navigation changes, verification files, assets, evidence and generated `backend/dist`. No staging, reset/clean/rebase/cherry-pick, branch-history rewrite, PR modification, commit or push. No production/hosted changes. CI remains separately authorized; no CI run triggered.

## 13. Next smallest sprint

Certify CLOSED foundation in isolated CI after repairing the stand-in actor assertion. Then implement and certify one person-identity case lifecycle and explicit reviewer assignment/decision RPC, with synthetic reserved private documents, replay/version/expiry/revocation and unauthorized actor tests. Only afterward add scoped live decision adapters and publication/request enforcement; do not open real uploads before retention/reviewer/Storage certification. Driver/delegation/custody is a separate later implementation stage.

## 14. Subscription readiness

NO-GO for treating KYC as completed or starting subscription enforcement. This pass demonstrates safe local progress, not production identity verification. No prices, billing provider, subscription tables, checkout or entitlement logic added.
