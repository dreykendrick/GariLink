# GariLink progressive verification and handover architecture

Status: proposal for approval; repository inspection only. No application code, migrations, hosted configuration, or documents collected. Updated 2026-10-09.

## 1. Product boundary and inspected implementation

Exploration requires no KYC. Authentication proves account control; phone verification proves contact possession; neither proves legal identity, driving eligibility, vehicle ownership, or insurance coverage. Verification must be proportional to the action and evaluated on the server at the moment of execution.

No existing Trust/KYC proposal was found in the inspected repository. This document establishes the updated proposal against the current implementation rather than claiming an existing verification subsystem is deployed.

Observed dependencies:

| Area | Current evidence | Required future change |
| --- | --- | --- |
| Signup | `register_page.dart`, `auth_repository.dart`, `auth_provider.dart` require phone; `handler.ts` POST `/auth/register` calls phone/password signup and returns pending phone | Add email/password signup with explicit email confirmation; retain existing names as optional profile fields |
| Login | Edge `/auth/login` already accepts email or phone | Preserve both for existing accounts; provide an email confirmation status and recovery flow |
| Routing | `core/navigation/app_router.dart` redirects both pending-phone and authenticated unverified-phone users globally to `/verify-phone` | Remove global contact gate only after compatible server policies exist; route email confirmation appropriately without mandatory phone/KYC |
| Identity | `20260908000000_identity.sql` bootstrap trigger creates account/profile/customer role without requiring phone | Preserve UUID identity and trigger; never link accounts by matching phone/email or user-controlled metadata |
| Models/session | `User.phoneNumber` is required; `UserModel` casts JSON phone to String; secure storage persists pending phone | Define absence consistently, preserve old DTO fields during rollout, separate pending email confirmation from contact-verification progress |
| Shared authorization | `require_user()` defaults to requiring `auth.users.phone_confirmed_at`; profile update and many account reads use it | Separate active-session authentication from action-specific trust policy; audit every caller before changing defaults |
| Workspaces/drafts | `workspace_access`, workspace creation/listing, and V2 draft creation transitively require verified phone | Permit authorized workspace setup and drafts with authenticated account, without document approval; keep tenancy/role checks |
| Publication/discovery | V2 readiness and discovery eligibility already check category/capabilities/media; eligibility also checks workspace owner's phone | Extend publication with evidence-backed account/workspace/vehicle/mode approvals; do not confuse `is_verified` or active listing capabilities with KYC |
| Rentals | Existing RPCs use phone-required session checks, snapshots, authoritative requestability, idempotency and overlap protection | Compose verification with those existing checks; retain pricing/location/TransportNeed snapshots |
| Contact disclosure | Rental serializers return customer phone to authorized workspace views | Review stage-specific minimum disclosure; never add identity or licence images to rental/public DTOs |
| SMS | `beem-sms` and `_shared/beem.ts`, SMS ledger migration | Retain for later phone verification; existing signup resend/SMS recovery cannot simply be reused as authenticated phone-change verification |
| Recovery | Flutter forgot/reset pages and Edge forgot/reset endpoints are phone/OTP based | Add email recovery with vetted redirect/deep links; preserve legitimate legacy phone recovery |
| Evaluation tooling | `create_test_users.mjs` creates email/phone-confirmed controlled accounts | Do not treat admin contact confirmation as identity/document approval; new trust fixtures require explicit synthetic evidence and decisions |
| Existing tests | Supabase API/rental/media/V2 tests and SQL assertions; Flutter auth/owner/rental/media tests | Extend their actual contracts; HTTP mocks alone cannot certify RLS or concurrent database enforcement |

The inspected schema has workspace membership roles, vehicle capabilities and rental statuses, but no dedicated driver-credential, reviewed identity, or dual-party custody protocol. Existing owner rental presentation mentions handover; that is not evidence that custody verification exists.

## 2. Simplified signup and dependency rollout

Preferred flow: email + password → confirmation email → secure confirmed account → Home/Explore. Optional names can remain compact profile inputs or be collected later. No phone/document form during ordinary registration. Unconfirmed accounts may still explore public inventory but do not receive unrestricted authenticated sensitive privileges. Email deliverability, resend limits, confirmation expiry, allowed redirect URLs, deep links and recovery must be configured and tested before cutover.

Phone remains in Supabase Auth and existing response contracts; absent phone is not a validation error for ordinary account use. Normalize and verify it when a sensitive action requires contact. An authenticated phone-update flow binds OTP verification to the current user and proposed number, handles collisions without account linking, rate limits resend/attempts, and invalidates relevant cached contact decisions after changes. Preserve email and legacy phone login/recovery. Do not auto-confirm email or phone in production to reduce friction.

Roll out additively: server policy/schema and compatible DTOs first; revised signup/session/recovery/router second; action-gate enforcement with old-client compatibility checks third. Inventory all `require_user`, workspace-access, saved, profile, rental-read and media callers, including later replacement RPC definitions. Read-only account operations must not inadvertently become KYC actions. Existing users start with unknown/unassessed identity, not approved. Existing phone confirmation remains contact evidence only. Legacy vehicles require explicit readiness review before future publication or custody; preserve history and authorized read access. Do not auto-approve currently published inventory: use a documented review/cutover plan, temporarily block new sensitive operations where evidence is missing, and manage already active rentals through an explicit operations exception process with audit and expiry.

## 3. Central action policy matrix

Each decision takes actor, action, subject/workspace/vehicle/booking, resolved operation mode, requested dates, and current evidence. Identity/contact requirements apply to the actual actor; workspace approval is separate from owner identity.

| Action | Required checks | Deliberately excluded |
| --- | --- | --- |
| BROWSING / DISCOVERY | Existing public visibility/privacy rules | Identity, phone, licence |
| VEHICLE_DRAFT_CREATION | Active authenticated account, authorized owner/workspace, existing listing permission | Document approval, phone prerequisite |
| VEHICLE_PUBLICATION | Approved owner identity and workspace legitimacy as applicable, verified contact, vehicle documents, ownership or rental mandate, mode-specific compliance, existing photo/category/capability gates | Renter credentials |
| WITH_DRIVER_RENTAL_REQUEST | Approved renter identity, verified contact, valid current vehicle with-driver approval, existing dates/suitability/requestability | Renter driving licence |
| SELF_DRIVE_RENTAL_REQUEST | Approved renter identity/contact, designated receiving driver's approved identity/licence and class eligibility for vehicle/dates, self-drive vehicle approval, applicable insurance | Unrelated passenger qualifications |
| DRIVER_ACTIVATION | Approved identity/licence/class, operating qualifications as applicable, explicit active workspace relationship when required | Workspace role alone as proof of licence |
| DRIVER_ASSIGNMENT | Assignment authorization, eligible driver/vehicle/service/date combination | Requiring a final assigned driver for a draft request |
| HANDOVER_RELEASE / ACKNOWLEDGE | Current booking state, explicit resolved mode, eligible vehicle, exact authorized parties, current trust decision, required evidence and confirmation | Identity images visible to counterparties |
| WITH_DRIVER_SERVICE_START / END | Booking/assignment/party authorization, vehicle and assigned driver eligibility at start, service evidence and dual acknowledgment | Self-drive custody-transfer semantics |

Driver preference `ANY` is discovery input, not authorization to choose weaker checks. Resolve a definite mode before submitting the rental request; persist it in the booking and use it for all later policies. Initial self-drive receiver is the renter unless an explicitly approved designated-driver workflow is implemented. Do not imply that a with-driver request is operationally ready before an eligible driver is assigned and rechecked for activation.

## 4. Server decision contract and enforcement

Proposed private policy function `evaluate_verification_action(actor, action, context)` returns allowed, stable reason codes, missing requirements, existing valid steps, pending/rejected/expired steps, policy version, evaluation timestamp, and opaque decision/context reference. Proposed client endpoint POST `/verification/requirements` accepts allowlisted action and subject IDs, deriving actor and ownership server-side. It is advisory; every sensitive mutation RPC reevaluates policy in the same database transaction as its existing authority/state checks. Flutter gating cannot grant eligibility. Untrusted `verified`, approval, mode, driver or workspace claims are never accepted from client metadata.

Use a structured 403 verification-required response distinct from unauthorized tenancy, 409 stale booking state, 422 invalid input, and retryable service failures. Extend API error parsing to retain safe typed requirement data. Discovery may expose safe vehicle eligibility indicators but never actor-specific identity details to anonymous users. Availability, matching suitability, publication and personal action eligibility remain distinct. Fail closed on review/credential/policy unavailability for sensitive actions while keeping browsing available.

## 5. Progressive verification state machine

Each evidence-backed requirement has NOT_STARTED → DRAFT → SUBMITTED → PENDING_REVIEW → APPROVED or REJECTED. Rejection permits an amended DRAFT and new submission version. Approved evidence can become EXPIRED, REVOKED or SUPERSEDED; it is never overwritten to erase the previous decision. Missing upload transport states are separate: RESERVED → UPLOADING → UPLOADED → VALIDATED, or FAILED/EXPIRED. Upload completion is not review approval.

Requirement-level states compose into action eligibility; there is no universal `user_verified` boolean. Reuse valid approved evidence for its permitted scope, version and dates. Licence expiry is checked over the intended rental/service period, not just today. A new document can be under review while old evidence remains valid only if policy explicitly allows it. Critical revocation immediately invalidates future actions. Draft progress is server-persisted, versioned and recoverable after reconnection; do not store raw documents in ordinary preferences/logs. Review decisions include reviewer, evidence version, timestamp, reason, expiry and appeal/resubmission guidance. No optimistic APPROVED UI.

## 6. Flutter Verification Gate and journey resumption

Use one typed gate controller backed by existing Riverpod, repositories, API client and router. Render a short bottom sheet for the explanation and overview; navigate to a focused verification page for uploads/review details. Show Completed, Needed, In review, Needs changes and Expired with text/icons, current theme tokens, accessible labels and normal text scaling. Show only requirements for the intended action: with-driver passenger never gets a licence request.

Store a typed resume intent (action, subject IDs, safe form draft reference, return route, context version, expiry) scoped to the authenticated user. Do not persist secrets, arbitrary URLs, signed document URLs or irreversible action commands. After approval, reauthenticate if needed, reload booking/vehicle/pricing context and reevaluate eligibility. Restore the form and ask the user to confirm submission; never automatically publish, book or transfer custody after a background review. Account switching/logout clears pending navigation intents. Price/date/inventory changes require fresh consent. Pending review offers Save and continue exploring; rejection points to only the rejected step and explains resubmission. Offline state retains progress and labels uploads as unsent until acknowledged. Use idempotent mutation keys and explicit retry state.

Reuse existing buttons, form styling, loading/error states and AuthContent where suitable. Add optional account verification status to Profile, contextual gate at booking/publish, and assignment/handover surfaces to authorized owner workflows. Avoid a compulsory onboarding checklist. New contact verification must not trigger the current global phone redirect.

## 7. Owner and workspace-agent handover authority

Allow the verified vehicle owner or a specifically delegated verified workspace agent to release a vehicle. Existing OWNER/MANAGER/MEMBER/VIEWER membership is insufficient on its own. Proposed scoped delegation records specify workspace, allowed vehicle/booking scope, `RELEASE_CUSTODY`/`CONFIRM_RETURN` permissions, validity, grantor and revocation; agents cannot self-grant and revocation is checked again at confirmation. Maintain existing workspace isolation and separate review-admin permissions from fleet operational roles. Delegation does not make an agent an eligible receiving driver.

The server pins release actor and receiving driver to the booking/event. Changes cancel outstanding challenges and require fresh authorization. Neither party can submit both confirmations, except an explicitly designed exceptional operations process; no such exception is part of the normal release flow. Counterparties receive safe identity-match/eligibility indicators and guidance for physical inspection, never stored identity or licence images or full document numbers.

## 8. Self-drive custody workflow

1. Load authorized booking in READY_FOR_PICKUP, definite SELF_DRIVE mode, approved vehicle, and eligible designated receiver. Check rental dates and active conflicts; lock/recheck booking during final commit.
2. At physical meeting, releasing party inspects original ID and original licence against the expected person. Record inspection attestation, issuer/class/validity result reference and responsible actor; photograph originals only if separately justified and permitted, not by default.
3. Capture condition photographs in private custody Storage, odometer with units/nonnegative validation, fuel value on a canonical scale, incident notes, server timestamp and booking/vehicle/actor references. Both parties review the same versioned evidence. A phone timestamp or uploaded photograph alone does not prove physical presence.
4. Server issues a cryptographically random short-lived booking/event-bound challenge (proposed five-minute expiry, configurable), storing only its digest, nonce, intended receiver/releaser, evidence digest and booking version. Prefer authenticated QR challenge redemption; if short manual code fallback is approved, apply strict online attempt limits and adequate entropy. Never use a permanent/master OTP.
5. Releaser confirms release; receiving driver separately authenticates and acknowledges evidence plus challenge. Step-up account authentication where required is distinct from the custody code. Changed evidence/state/parties invalidate confirmation. Dual confirmation finalizes exactly once in a transaction and transitions rental to ACTIVE through the guarded existing lifecycle integration.
6. Maintain append-only audit events and a canonical immutable finalized evidence manifest. Uncertain client timeouts resolve by querying event status; same idempotency key returns original result, a changed payload conflicts. Expired or consumed challenges, mismatched actors, stale booking revisions and duplicate activation fail safely.

Handover event lifecycle: DRAFT → READY_FOR_CONFIRMATION → RELEASE_CONFIRMED → FINALIZED, with separate receiving acknowledgment record; EXPIRED/CANCELLED invalidate pending challenges. Either confirmation order can be supported only if both bind the same manifest; no one-sided event becomes finalized. Database uniqueness enforces one finalized outbound event per booking and one confirmation per actor/event/version. An interrupted first acknowledgment does not transfer custody in app state. Provide a support/dispute path for real-world departures before completion; do not claim a digital record alone proves legal transfer.

Return custody uses a separate inbound event with both parties, fresh challenge, condition photos, odometer/fuel comparison and incident review before completion. Do not reuse the outbound challenge. Return acknowledgment must remain possible when credentials have expired or been revoked during an active rental through a specifically authorized recovery/operations policy, without authorizing another drive or release. This exception requires legal/operations approval and audit; ordinary APIs must not allow manual completion to bypass custody evidence.

## 9. With-driver service workflow

Booking approval → eligible driver assignment → readiness → physical passenger/service-start acknowledgment → ACTIVE → service-end acknowledgment → COMPLETED. The owner/authorized operational actor and renter acknowledge start/end against assigned driver, vehicle and booking version. Record service evidence appropriate to passenger transport and dispute needs; no original renter licence inspection, no representation that vehicle custody transferred to the renter. Driver eligibility is rechecked at assignment and start. Changing driver/vehicle invalidates outstanding acknowledgments. Optional custody movement between owner and employed driver is a separate internal fleet process, not passenger handover.

## 10. Proposed database, private Storage and RLS

Additive candidate tables, not migrations in this pass:

| Object | Purpose / constraints |
| --- | --- |
| `gl_verification_cases` | Subject user/workspace/vehicle, scope, policy version, versioned progress and review status |
| `gl_verification_evidence` | Case, evidence type/version, reserved private object path, validated MIME/size/hash, expiry, retention state; exclude raw document content from public JSON |
| `gl_verification_decisions` | Append-only reviewer decisions tied to exact evidence/scope; client cannot approve/revoke |
| `gl_driver_profiles` and credential records | Identity link, issuing authority/class/validity, qualifications; approved evidence references rather than client booleans |
| `gl_vehicle_compliance` | Ownership/mandate, insurance and mode-specific document approval references/expiry |
| `gl_handover_delegations` | Scoped, revocable workspace agent authority |
| `gl_handover_events`, confirmations, challenges | Booking/mode/direction/version, evidence manifest, unique confirmations, nonce expiry/consumption, atomic lifecycle finalization |
| `gl_trust_audit_events` | Actor, action, target, decision version and redacted reason; controlled retention and append-only application access |

Use foreign keys and composite vehicle/workspace references, checked states, positive revisions, unique submission/idempotency keys and indexes for case-subject/state, credential-expiry, booking-event and delegation lookup. Separate identity-document and custody-photo private buckets; never reuse public-safe vehicle media serialization for them. RLS denies anonymous access and client decision writes. Applicants may access their own draft/evidence/status; workspace users access permitted business cases, not employees' unrestricted personal documents. Reviewers receive narrowly scoped document access with audited reason and short-lived URLs. Counterparties can access only authorized booking condition evidence and safe verification results. Signed URL issuance must check current scope/actor every time; revocation cannot erase an already issued URL, so short TTL and secure cache handling matter.

Follow current narrow RPC/security-definer pattern with empty search_path, explicit object qualification, revoked default execute grants and authenticated-only entry points. Do not expose privileged reviewer credentials in Flutter. Service-role Edge calls must explicitly enforce caller identity; service-role RLS bypass is not user authorization. Never let workspace members grant themselves trust roles. Storage upload reservations bind exact case/user/object path and allowed metadata; validate uploaded bytes, content type, size, malware handling and ownership before review. Cleanup uses Storage API, not direct storage.objects deletion. Identity-document retention differs from fraud/rental audit retention; apply legal hold only under explicit rules. Restrict logs and backups as well as tables.

## 11. API and screen integration map

Proposed endpoints: requirements evaluation; case create/read/patch/submit; evidence reserve/finalize; contact start/confirm; scoped reviewer decision; handover create/read/evidence/confirm; service start/end acknowledgment. All are new contracts for future implementation, not deployed routes. Use optimistic revisions, request IDs, strict allowlists and safe DTOs.

Integrate enforcement into current V2 publication RPC, latest create-rental RPC, driver assignment and guarded rental-action RPCs. Existing `ready/start/complete` operations must not remain an alternate bypass once custody/service confirmation is enforced. Inspect legacy publish/rental endpoints and all direct RPC grants in the same rollout. Preserve owner rejection/cancellation and authorized Trips reads even when unrelated verification is incomplete. Compose existing committed-rental availability guards, suitability, date validation, price estimates and overlap exclusion; KYC cannot replace these checks. Policy expiry/revocation must invalidate requestability/action decisions without leaking applicant details through discovery.

Flutter impact: registration/recovery/email-confirmation pages and auth hydration; app_router; nullable/absent-phone handling in models/profile; reusable gate repository/provider/screens; booking-mode resolution and return-to-booking state; owner publication readiness; Profile status; authorized driver/delegation operations; rental detail custody/service screens. Home purpose options and existing TransportNeed semantics remain intact. Existing vehicle photography upload is preserved as a distinct media domain.

## 12. Implementation sprints and approval gates

1. **Policy and compliance definition:** approve evidence requirements by action/mode, designated-driver rule, licence classes, review roles, retention and transition policy. Confirm jurisdiction and insurer requirements with qualified local counsel/operations. Do not encode assumed legal rules.
2. **Email-first account foundation:** additive compatible auth DTOs, email confirmation/recovery/deep links, auth-vs-contact helper separation, caller audit and safe router update. Test old-client and legacy-phone behavior before production cutover.
3. **Trust evidence and review:** private buckets/RLS, draft/resumable uploads, immutable decisions, reviewer authorization and expiry/revocation. Build reviewer operations before enabling mandatory review gates.
4. **Progressive gate and sensitive actions:** reusable Flutter gate, safe resume intent, publication and request enforcement, explicit operation mode, legacy transition review. No licence ask for with-driver renters.
5. **Driver and scoped delegation:** reviewed credentials/classes, vehicle insurance/mode eligibility, driver activation/assignment and explicit releasing-agent permissions.
6. **Physical custody and service confirmation:** dual-party manifests/challenges, outbound/inbound events, service acknowledgment, atomic lifecycle integration and documented operations exceptions.
7. **Hosted certification and staged rollout:** SQL/RLS/concurrency evidence, real controlled auth/users/synthetic approved media, physical two-device flows, privacy and recovery validation. Pause controlled public inventory after tests. Release each stage only with backward compatibility and operational readiness.

This brief authorizes architecture work only. Production-impacting implementation, migrations, Auth setting changes, deployment and real document collection await explicit approval. Approval should reference the stage and resolved product/compliance decisions, not merely the document title.

## 13. Security, privacy and regulatory risks

Risks include document theft, reviewer misuse, excessive retention, fraudulent originals, social-engineered custody codes, replay/concurrency, revoked agents, account recovery takeover, inconsistent policy across legacy RPCs, mode ambiguity and expired insurance/licences. Mitigate with minimum evidence, audited scoped access, reauthentication for sensitive changes, transactional current-state checks, rate limits, immutable manifests, backend-authoritative review, revocation and expiry propagation, and staged policy rollout.

No legal/regulatory certification is claimed. Tanzania-specific data protection, identity/licence inspection, passenger/commercial transport authorization, insurance coverage, data residency/transfers and evidence-retention obligations require current qualified advice before implementation. Contact verification is not legal identity. Manual ID inspection is not a guarantee against impersonation. Digital acknowledgment is not automatically a legally sufficient signature. Decide accessibility alternatives and assistance paths without introducing a bypass that silently approves missing evidence.

Open approval decisions: accepted identity types and review standard; applicable licence/vehicle classes; self-drive designated-driver availability; with-driver operator qualifications; insurance evidence/coverage checks; reviewer staff/access controls; retention/legal hold; challenge UX/time limits; delegation granularity; active-rental exceptional return handling; legacy publication transition period. None should be silently hardcoded as law.

## 14. Regression and acceptance strategy

Architecture-only pass: no executable behavior changed, so no new runtime pass claim or certification. Previous 178-test Flutter result remains historical evidence, not proof of the proposed trust system.

Future acceptance matrix:

| Scenario | Required evidence |
| --- | --- |
| Email-only signup and exploration | Confirmed email normal login/recovery, absent phone DTO roundtrip, no phone/KYC redirect, old phone accounts still authenticate |
| Owner draft without review | Normal authorized owner can create workspace/draft; cross-workspace mutation denied; publication missing requirements denied |
| Progressive gate | Only missing scoped steps, approved evidence reuse, saved interrupted draft, pending never displayed as verified, rejected-step resubmission |
| With-driver request | Renter licence never requested; valid identity/contact/vehicle policy required; assignment/start check actual driver |
| Self-drive request | Correct eligible receiver/class/period/insurance; ANY mode resolved; tampered mode/driver rejected |
| Server authority | Direct RPC/old Edge/client bypass attempts denied; self-issued metadata and capability flags cannot approve documents |
| Privacy/RLS | Anonymous, other renter, workspace coworker and unrelated reviewer denied personal evidence; counterparties see safe results only; signed URL checks verified |
| Custody | Two authenticated parties, original-document attestation, required photos/odometer/fuel, identical evidence revision; no one-party activation |
| Replay/concurrency | Expired/reused/wrong-booking challenge, duplicate payload, changed payload, cancellation/revocation race and simultaneous commits resolve safely |
| Service confirmation | Passenger not represented as receiving driver; assignment changes invalidate start acknowledgment; end lifecycle coherent |
| Journey recovery | App kill/offline/upload retry/session expiry/account switch/review approval restore safe draft and require fresh action confirmation |
| Legacy/regression | Existing rentals/snapshots/pricing/discovery/media/availability/isolation; existing users remain unassessed; no backfilled approval |
| UI/accessibility | 320/360/390/430/600 widths, 200% text, keyboard, screen-reader states/touch targets, physical two-device custody flow |

Run Supabase `npm test` plus SQL policy/integration and concurrent-transaction tests against clean local migrations and controlled hosted fixtures. Run Dart format verification, Flutter analyzer and full Flutter tests after implementation. Test actual Auth configuration and private Storage, not only mocked HTTP. Physical identity inspection and real review operations remain separate validation gates. Certification must identify executed cases, pending cases and exact cleanup; no tests are added merely to assert this proposal's wording.
