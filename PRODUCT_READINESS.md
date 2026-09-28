# GariLink product readiness

Status: NOT READY. Working audit; an unchecked item is not a verified feature.

## Repository map

- `mobile_flutter`: current Android/iOS client; Riverpod, GoRouter, Dio, secure storage, Material 3. Entry `lib/main.dart`.
- `backend`: NestJS modules, domain/use-case/repository layers, Prisma/PostgreSQL. Entry `src/main.ts`.
- `mobile`: legacy Expo/React Native client using the same API; retained pending migration verification.
- Local checkout is a downloaded source snapshot, not an independent Git checkout. Preserve prior work; do not stage the parent home-directory repository.

## Audit and remediation tracker

| Priority | Area | Evidence / required work | Status |
|---|---|---|---|
| P0 | Sessions | Reject inactive/missing sessions; read current roles; enforce capability expiry | Implemented; backend regression tests pass |
| P0 | Refresh | Random token IDs, atomic rotation; single-flight client refresh and logout race protection | Backend/database checks pass; mobile tests pending |
| P1 | OTP | Cryptographic six-digit codes, purpose/code validation, real resend/cooldown, safe sign-out | Implemented; mobile/device verification pending |
| P1 | Startup | Hydration-driven splash/retry; persist completed onboarding | Implemented; mobile/device verification pending |
| P1 | Account state | Scope private caches to current user; discard stale auth operations and expire UI sessions | Implemented; mobile regression verification pending |
| P1 | API | Handle empty action responses, validation arrays, sanitized failures, preserve tokens during outages | Implemented; mobile regression verification pending |
| P1 | Owner onboarding | List-vehicle CTA leads to dashboard; no complete creation/media flow | Open |
| P1 | Authorization | Review every workspace, organization, vehicle, media and listing write | Open |
| P1 | Rentals | Serialize rental writers per vehicle, check overlaps at save, atomic approval/cancellation, reject stale transitions | Unit/database checks pass; full journey/time-zone review open |
| P1 | Profile/menu | Real identity/sign-out and backend-connected personal-information editor added; other settings/account/menu flows incomplete | Partial; new mobile tests pending |
| P1 | Marketplace | Prevent public draft/paused/deleted/expired reads; atomic view counts; rental price/city filters; idempotent saves | Backend fixes checked; mobile favourite controls/pagination still open |
| P1 | Deployment | Missing migrations, release signing, production API, actual SMS/email | Open |
| P2 | Design | Forced dark mode combined with light-only surfaces; mixed text styles | Open |
| P2 | Inputs/buttons | Material buttons with focus/semantics and growing height; password tooltips, field validation, OTP autofill | Implemented; broader forms and device QA pending |
| P2 | Images | Removed unrelated stock-photo fallback; details endpoint now includes actual vehicle images | Implemented; device QA pending |
| P2 | Dependencies | Audit reported 34 vulnerabilities after bcrypt replacement | Open |
| P2 | Legacy app | Inspect migration/security differences before release | Open |
| P3 | Copy | Replaced unsupported GPS promise with discovery/rental-request copy | Implemented |

## Screen coverage

Source inventory: splash, onboarding, welcome, login, register, phone verification,
forgot/reset password, home, explore/filters, vehicle details, booking, trips,
profile, owner dashboard, my vehicles, incoming requests, analytics, owner menu.
All require interaction/error/accessibility review; source inspection alone is not device QA.

## Verification record

Prior session: backend build and 19 unit tests passed; local registration/login and
marketplace listing requests passed. These are baselines, not evidence for new edits.
Flutter formatting passed, but analyzer/compiler subprocesses previously failed with
Windows Access Denied. User-built Android APK exposed registration/router and API
configuration defects. Updated build and regression checks must be recorded below.

### 2026-09-08 hardening pass

- `npm run build` (backend): PASS after the latest marketplace/security/rental edits.
- `node node_modules/jest/bin/jest.js --runInBand` (backend): PASS, 12 suites / 47 tests.
- `node --env-file=.env scripts/check-local-concurrency.cjs` (backend): PASS against the isolated localhost:5433 development database. Checks real concurrent rental creation, stale transition rejection, atomic approval/cancellation, concurrent refresh rotation, rental search query validity, idempotent vehicle saves, and hidden draft listings. Each invocation removes only its own generated fixtures; existing test accounts and vehicles are preserved.
- Direct SDK `dart.exe format` on edited Flutter sources/tests: PASS. Syntax formatting is not static analysis or compilation.
- `flutter test --no-pub` (mobile_flutter): BLOCKED in this session by Windows Access Denied launching `vswhere.exe`.
- `dart analyze` (mobile_flutter): BLOCKED in this session by Windows Access Denied launching `dartaotruntime.exe`.
- Asked the user to run Flutter analysis/tests from `mobile_flutter`. Their first attempt ran in `backend`, so its "No issues found" result is NOT mobile validation; corrected directory instructions provided.
- Mobile tests added for empty responses, validation arrays, sanitized server errors, concurrent refresh, login isolation, transient outages, logout/refresh races, and onboarding persistence. They remain unverified until run successfully.

### Visible fixes in this pass

Startup no longer forces onboarding on a timer. It waits for session hydration and
offers retry/sign-out on failure. OTP resend contacts the backend and uses a
cooldown; verification supports numeric input and autofill. Shared buttons use
Material keyboard/focus/disabled semantics. Profile name, initials, phone, and phone
verification come from the signed-in account instead of a hardcoded identity.
Profile and owner-menu sign-out controls are wired. Missing vehicle photos are not
replaced with pictures of a different car.

### Work still required before sign-off

### Follow-up: mobile diagnostics and profile editing

The user ran checks from `mobile_flutter` and supplied the complete output:
`flutter test --no-pub` passed **9 tests**. `flutter analyze` completed with **94
diagnostics** (warnings/information, no analyzer errors). This verifies the previous
mobile revision, not the additions below.

- Addressed the reported unused imports, deprecated `withOpacity` calls, unused
callback argument naming, constructor super-parameters, null-aware map elements,
and multiline control-flow braces. No analyzer rules were disabled.
- Added a real Personal Information sheet with prefilled name, display name, city
and biography, input limits, keyboard/autofill support, loading state, retained
input on failures, and confirmation after a successful save. Account state and the
home greeting receive the server-confirmed updated profile. Late saves after
sign-out cannot restore the previous account.
- Added four mobile profile tests (save, failure/retry state, sign-out race, and
widget form submission) in `mobile_flutter/test/profile_edit_test.dart`. These new
tests and the analyzer cleanup need a fresh user-side Flutter run.
- Added backend profile field limits and date/gender validation with three tests.
- Latest `npm run build`: PASS. Latest
`node node_modules/jest/bin/jest.js --runInBand`: PASS, **13 suites / 50 tests**.
- `dart.exe format --output=none --set-exit-if-changed lib test`: PASS, **65 files,
0 changes**.

### Remaining implementation and release gates

Do not interpret the fixes above as completion of the master audit. Owner vehicle
creation/media upload, remaining profile settings, inert menus/favourite
controls, pagination/filter UI, coherent light/dark surfaces, full authorization and
dependency review, deployment/migrations/signing, and full Android user-journey,
offline, accessibility and visual regression checks are still outstanding. Backend
checks do not establish APK readiness. The currently installed APK and any already
running backend process may still contain the earlier code until rebuilt/restarted.

## External launch decisions

Confirmed by the user: migrate the backend fully to Supabase (not a separate NestJS
host), use Beem for SMS, and arrange rental payments outside GariLink. Supabase
project reference/existing-data status, provider secrets, Android release signing,
approved legal/support content and insurance policy still need configuration or
decisions. Local test credentials and local database must never be deployed.

### 2026-09-08: Supabase migration foundation

- User-provided Flutter results confirmed **no analyzer issues and 13 passing
  tests** for the revision before this migration. Older pending-test notes above
  are historical; they are not the current baseline.
- Added `supabase/` with native SQL migrations, an Auth/profile/workspace Edge API,
  signed Beem SMS hook, durable SMS delivery deduplication, configuration examples,
  and a migration/cutover checklist in `supabase/README.md`.
- Native identity and workspace tables use RLS with no direct client grants.
  Narrow RPCs enforce active accounts, verified phone where required, current
  session existence, workspace ownership/membership, and field allowlists.
  Signup metadata cannot assign elevated roles/capabilities. Workspace creation
  is idempotent by caller/request UUID and cannot reactivate revoked capability.
- Beem hook verifies timestamped signatures before sending, validates phone/code,
  checks provider acceptance, retains TLS verification, refuses redirects, bounds
  latency/body size, sanitizes failures and does not log secrets or OTPs. Durable
  claims prevent accepted/uncertain webhook retries from triggering a second send.
- Flutter now handles pending verification without session tokens, restores it
  across restarts using secure storage, and accepts the real session after OTP.
  Added eight regression tests for pending/legacy signup, hydration, verification,
  retry, missing-session responses, and sign-out races. They remain unverified
  until the requested user-side Flutter run completes.
- Registration/reset UI uses the 10-character Supabase password minimum and
  Tanzania phone examples. Booking copy states payment is arranged with the owner;
  no payment collection or paid-status claim was added.
- The still-available legacy API now checks workspace access for vehicle routes
  and listing creation, distinguishes viewer reads from owner/manager writes,
  rejects caller-supplied workspace spoofing, and defaults new listings to TZ/TZS.
  Final backend build and combined **14 suites / 54 tests pass**. The real local
  database concurrency/search/save checks also pass again; their invocation-owned
  QA fixtures were removed and existing demo accounts/vehicles preserved.

Verification of this migration stage:

- `npm test` in `supabase`: **25 tests pass**, with provider/Auth HTTP responses
  mocked. No live provider calls were made.
- Strict TypeScript `tsc --noEmit` for shared code/handlers/tests: **PASS**;
  Deno entrypoints are excluded and still need Deno runtime validation.
- `supabase/tests/run-local-sql.ps1`: **PASS** on localhost:5433/garilink_dev with
  minimal Auth stand-ins. Checks bootstrap, profile validation, safe projection,
  role isolation, suspension/revocation, SMS deduplication, idempotent workspace
  creation, viewer restrictions and capability preservation. All changes are
  rolled back, preserving existing users/vehicles. Not a full Supabase stack test.
- Direct Flutter formatting: **PASS, 66 files / 0 changes**. No claim of fresh mobile analyzer/test
  success for the new registration changes.
- `supabase status`: blocked by Docker subprocess EPERM. Deno dependency install
  also blocked by subprocess EPERM. No alternate copied runtime workaround used.

This migration is **not complete or deployed**. Vehicles/listings/search/saves,
rentals and race-safe availability, Storage/media, organization/member workflows,
verification/audit/background work, data import, owner creation UI, remaining UI/UX
polish and all production release gates remain. The app's current API URL has not
been switched. A hosted project reference and fresh Flutter results were requested;
do not delete the existing backend or import demo credentials into production.

Final verification re-run (2026-09-09): all 25 Supabase logic tests and all three
local SQL test groups pass after formatting and the expired-session HTTP 401 fix.
The latest legacy build, 54 unit tests, and local concurrency script pass. The
Supabase migration has not been applied to a hosted project. Fresh Flutter
analysis/tests, Deno entrypoint execution, real Auth/PostgREST integration, and
authorized Beem delivery testing remain outstanding.

### 2026-09-09: native marketplace and owner-draft continuation

Implemented in source, not deployed:

- Fourth Supabase migration: native vehicle/listing/save tables, RLS/no direct
  client grants, explicit public projection, private inventory authorization and
  current capability checks. Public results hide drafts, paused/archived/sold/
  expired records and inactive/banned owners. No private VIN, registration,
  tracking or retry payload is exposed through the new creation contract.
- Atomic vehicle-plus-draft creation with per-caller UUID retry deduplication and
  conflicting-payload rejection; listing lifecycle uses row locks. Saved-state
  writes are explicit and idempotent; other accounts' saved lists stay private.
  Expired listings display as expired and can be renewed by an authorized owner.
- Search pagination/filtering, including daily-rate filtering for hire listings;
  owner/vehicle inventory, saved-list reads and status/save routes in the Edge API.
  Not-found/conflict errors are sanitized and retain HTTP 404/409 semantics.
- Flutter Add vehicle form (disabled migration flag by default) includes workspace
  selection/personal-workspace creation, vehicle specifications, TZ location/price,
  validation, private-draft copy, loading state, retained input and safe same-page
  retries. It is not a completed photo/edit workflow. Existing APK/API URL unchanged.
- Owner action loading state is tracked per listing; public search is invalidated
  after status changes. Missing analytics display a dash, not invented counts.
  Vehicle repository no longer disguises connection failures as empty inventory.
- The gated main + entry supports first-time owners before they have an owner role;
  account roles refresh from the server after returning from the form. Owner-only
  navigation and SQL permissions were not relaxed to bypass onboarding.

Verification:

- Supabase portable logic suite: **33 tests pass** (mocked HTTP; no live providers).
- Strict TypeScript checks for handlers/shared code/tests: PASS; Deno entrypoints
  still excluded and need runtime validation.
- Local rollback SQL fixture: PASS across identity, SMS, workspace and marketplace
  groups, including draft retry/validation, tenant isolation, search, expiry,
  lifecycle, capability expiry and saved isolation. These are sequential SQL tests,
  not evidence of full Supabase integration or concurrent marketplace RPC testing.
- Added six owner-draft Flutter tests (three retry-unit and three widget tests).
  New total expected: 27 including pending-auth tests; not yet executed successfully.
  Fresh `flutter analyze --no-pub` failed with Windows access denied starting Dart's
  analysis server. User-side analyze/test output requested again. Last confirmed
  mobile baseline remains no analyzer issues / 13 tests before these migrations.
- Direct Dart formatting passes across 69 source/test files. SQL fixture cleanup
  verification found zero remaining test schemas or roles; existing local data
  was preserved.

Next implementation/release gates: Storage/media and draft editing; rental terms,
  race-safe bookings/availability; saved-list UI and inventory pagination; remaining
  organization/invitation/verification/audit/background work; full legacy data and
  state mapping; UI/device/accessibility QA; production configuration and signing.
  Native draft specifications are a bounded initial contract, not a complete import
  of all legacy vehicle fields. Do not drop the legacy backend or switch the app yet.
  Hosted project reference/existing-data status remains needed for deployment.

PRODUCT READINESS: NOT READY

### 2026-09-12: second-pass independent audit

The evidence matrix, screen inventory, interaction trace, validation commands,
completion scores, and blockers are recorded in `SECOND_PASS_AUDIT.md`. This pass
corrected the mobile production endpoint, enabled the deployed owner-draft path by
default, removed or explicitly disabled empty/deceptive interactions, and retained
honest unavailable states for features whose Supabase APIs do not exist.

Fresh checks: Flutter formatter PASS; analyzer PASS; 27/27 Flutter tests PASS;
33/33 Supabase portable tests PASS; legacy Nest build PASS and 54/54 tests PASS.
Android debug/release build verification is not green: the inherited Gradle cache
points to a nonexistent drive, and the isolated-cache debug retry did not complete.
Release signing still uses the debug key and therefore is not production-ready.

PRODUCT READINESS: NOT READY

### 2026-09-11: hosted Supabase core deployed and validated

- Applied the identity/profile, durable SMS ledger, workspace authorization, and
  marketplace vehicle/listing/save migrations to the dedicated GariLink project
  `yvcdkmsfuakjflmuatgz`. Direct anonymous/authenticated access to application
  tables remains revoked; access is through narrowly granted security-definer RPCs.
- Reconciled `supabase_migrations.schema_migrations` with the four local migration
  versions and enabled RLS on that bookkeeping table. The hosted SQL Editor
  returned all four versions in order.
- Deployed `garilink-api` with gateway JWT verification disabled intentionally;
  the facade validates caller sessions for protected routes and leaves only the
  documented health and public marketplace routes unauthenticated.
- Pushed the mobile callback URL to Auth configuration and enabled database SSL
  enforcement. Network restrictions remain disabled until fixed deployment/CI
  egress addresses are known, avoiding an accidental operational lockout.
- Live checks passed: health returned HTTP 200 with Supabase/off-platform-payment
  status; empty marketplace search returned HTTP 200 and the expected bounded
  envelope; an unknown listing returned the sanitized HTTP 404 response; direct
  anonymous selection from `gl_vehicles` was denied.
- Fresh verification after deployment: Supabase portable suite **33/33 passed**;
  Flutter analyzer reports **no issues**; Flutter tests **27/27 passed**. One
  analyzer-only missing-braces lint in the owner draft error path was corrected.
- The Beem SMS function and Auth Send SMS Hook are deliberately not deployed or
  enabled. Production `BEEM_API_KEY`, `BEEM_SECRET_KEY`, `BEEM_SENDER_ID`, and the
  hook signing secret are still required. No live SMS or production account was
  created during this deployment.

Still blocking release: Beem credentialed delivery and abuse/rate-limit testing;
Storage/media; rental booking/availability; organizations/invitations/verification/
audit/background jobs; approved legacy-data import; complete Flutter Supabase
cutover and Android journey/accessibility testing; monitoring, backup/restore and
incident runbooks; production signing/store release. The legacy backend must remain
available until these replacement paths are complete and acceptance-tested.

PRODUCT READINESS: NOT READY

### 2026-09-11: dedicated hosted project created

- Created a separate Supabase project named **GariLink** in the existing Winger
  organization. Project reference: `yvcdkmsfuakjflmuatgz`; region: `eu-west-1`;
  observed status after creation: `ACTIVE_HEALTHY`.
- Project creation used a generated strong database password. The dashboard did
  not expose that credential after navigation, and it was not copied into source,
  logs, chat, or a local plaintext file.
- Data API remains enabled because the application uses PostgREST RPCs. Automatic
  exposure of new tables was disabled and automatic RLS was enabled at creation.
- At creation time no migration, function, hook, account, or production data was
  deployed. The subsequent hosted-core deployment is recorded in the section
  above. The existing Winger project `dqclmqbegnimtbkndrif` and its users/functions
  were not modified.
- The CLI link attempt could not complete without the generated database password.
  The stale local link cache that pointed at Winger was removed. Migrations were
  then applied through the hosted SQL Editor and their four versions were recorded
  in `supabase_migrations`; a password is still needed to establish a durable local
  CLI link for future `db push` workflows.

PRODUCT READINESS: NOT READY
