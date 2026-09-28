# GariLink second-pass readiness audit

Audit date: 2026-09-12. This document records evidence from the current source,
current automated checks, and the dedicated hosted Supabase project. It does not
treat implementation presence as runtime verification.

## Executive summary

The Flutter client has a coherent Riverpod/GoRouter/Dio foundation and a substantial
design-token layer. Authentication, profile, workspace, and the first marketplace
slice have defensive code and automated coverage. The dedicated Supabase facade and
four core migrations are live. The audit nevertheless found that the APK still
defaulted to an emulator-only NestJS address, owner creation was disabled by default,
several visible controls did nothing, rentals were exposed although no Supabase
rental routes exist, Android release signing used the debug key, and Beem is not
configured. These are release blockers.

This pass switched the client default to the dedicated hosted facade, enabled the
deployed owner-draft path, removed the nonfunctional saved icon, disabled rental
requests with explicit copy, converted empty owner-menu interactions to visibly
unavailable rows, and replaced the dead profile CTA with accurate guidance.

## Architecture verified

- Flutter: feature folders, Riverpod providers, GoRouter redirects/shell navigation,
  Dio client, secure token storage, SharedPreferences for non-secret onboarding state.
- Hosted backend: Supabase Auth/PostgREST plus `garilink-api`; PostgreSQL RLS and
  security-definer RPCs. Beem SMS hook source exists but is not deployed/configured.
- Legacy NestJS/Prisma backend remains in the tree and passes its suite, but is not
  the intended final architecture.
- Android package is `ke.co.garilink.garilink_mobile`. Release signing is not ready.
- Repository Git history is unavailable: the enclosing Git repository has no commits
  and spans the user profile, so it is not usable evidence for project changes.

## Screen inventory and status

| Surface | Status | Evidence / remaining work |
| --- | --- | --- |
| Splash | PARTIAL | Widget launch coverage; no clean-install device pass |
| Onboarding | PARTIAL | Widget navigation covered; visual/accessibility device QA missing |
| Welcome | PARTIAL | Routes correctly; still a lightweight legacy-styled screen |
| Sign in | PARTIAL | State/API failures covered with mocks; no live account journey |
| Register | BLOCKED | Pending-verification logic tested; Beem hook is not configured |
| Verify phone | BLOCKED | OTP state tests pass; no real SMS/OTP delivery test |
| Forgot password | BLOCKED | Route and repository exist; real delivery/recovery unverified |
| Reset password | BLOCKED | Client flow exists; deep-link/device and live Auth unverified |
| Home | PARTIAL | Real marketplace provider; no populated hosted-data/device review |
| Explore/search | PARTIAL | Hosted empty search returns 200; populated/filter UI unverified |
| Vehicle details | PARTIAL | Error/404 behavior exists; real listing/media not available |
| Booking | BROKEN | UI exists but Supabase rental endpoint is absent; entry now disabled |
| Trips | BROKEN | Calls absent Supabase rental routes |
| Profile | PARTIAL | Edit widget test passes; live persistence needs an authenticated user |
| Edit-profile sheet | PARTIAL | Validation/trim/submit test passes; device keyboard QA missing |
| Owner dashboard | PARTIAL | UI exists; rental-derived operational data is unavailable |
| My vehicles | PARTIAL | Hosted inventory/draft RPCs exist; no live owner account journey |
| Create listing | PARTIAL | Validation/retry tests pass; no photos/editing/live account E2E |
| Incoming requests | BROKEN | Depends on rental routes not migrated to Supabase |
| Analytics | UI COMPLETE / FUNCTIONALLY INCOMPLETE | Presentation exists; production analytics source absent |
| Owner menu | PARTIAL | Logout is real; unsupported rows are now explicitly disabled |
| Rental cancellation dialog | NOT TESTED | Repository path exists only on legacy backend |
| Rental rejection dialog | NOT TESTED | Repository path exists only on legacy backend |
| List-vehicle sheet | OBSOLETE | Used only when explicitly disabling deployed owner tools |

Page screens discovered: 21. Overlay/dialog surfaces discovered: 3. No screen is
classified VERIFIED because no complete physical-device/live-account journey was
executed during this audit. Page status counts: verified 0, partial 13, broken 3,
blocked 4, functionally incomplete 1. Overlay counts: not tested 2, obsolete 1.

## Interaction findings

Verified by trace or automated test: authentication submits/loading, OTP resend,
logout local clearing, profile edit, public search retry/result selection, owner
draft validation/idempotent retry, listing publish/pause/archive dispatch, navigation
guards, rental cancel/reject confirmation code, and error retries.

Corrected deceptive controls: vehicle save (empty callback removed), seven owner-menu
rows (empty callbacks replaced with disabled semantics and explanatory text), profile
owner CTA (empty callback replaced with guidance), and booking CTA (disabled while
the required backend does not exist). Remaining questionable interactions are trips,
incoming requests, owner rental actions, analytics, and the legacy list-vehicle sheet.

## User journeys

| Journey | Status | Evidence |
| --- | --- | --- |
| First launch/onboarding | PARTIAL | Widget tests only |
| Returning session | PARTIAL | Hydration/race unit tests; device restart absent |
| Registration/OTP | BLOCKED | Mocked tests pass; Beem/live Auth absent |
| Login | PARTIAL | Mocked API/state coverage; no live credentials |
| Logout | PARTIAL | Local clear/race tests; live token revocation unverified |
| Password recovery | BLOCKED | Live SMS and device callback absent |
| Public search | PARTIAL | Hosted empty result verified; populated path absent |
| Listing detail | PARTIAL | Sanitized hosted 404 verified; real record absent |
| Create vehicle draft | PARTIAL | Unit/widget/SQL coverage; live account path absent |
| Rental booking/lifecycle | BROKEN | Not migrated to Supabase |
| Profile edit | PARTIAL | Widget/API logic covered; hosted E2E absent |

## UI/UX and engineering assessment

The token system, shared widgets, typography hierarchy, contextual loading/error/
empty states, and general visual direction are useful foundations. Consistency is
not complete: the app forces dark mode while multiple pages and sheets hardcode white
surfaces; the Welcome screen uses a separate basic style; there are many feature-level
hardcoded colors/sizes; text scaling, small-screen overflow, semantics, and contrast
have not been comprehensively tested. Google Fonts also introduces first-run network
and caching behavior that needs release/device validation.

Networking has bounded timeouts, sanitized errors, refresh de-duplication, and
session-revision race protection. Hosted table access is denied and public RPCs are
bounded. Major gaps are rental/storage/organization APIs, Beem secrets and abuse
controls, media processing/caching, monitoring, backups, data import, deep links,
release signing, and real-device performance/accessibility evidence.

## Validation results

- `dart format lib test`: PASS, 69 files; 3 changed by formatting.
- `flutter analyze --no-pub`: PASS, no issues (85.8 s).
- `flutter test --no-pub`: PASS, 27 passed / 0 failed / 0 skipped.
- `npm test` in `supabase`: PASS, 33 passed / 0 failed / 0 skipped.
- `npm run build` in `backend`: PASS.
- `npm test -- --runInBand` in `backend`: PASS, 14 suites and 54 tests.
- `flutter build apk --debug --no-pub`: FAIL/BLOCKED. Initial run referenced the
  nonexistent `E:\\flutter_cache\\gradle`; isolated-cache retry did not complete or
  emit a new artifact after an extended CPU-bound Gradle run. The old APK is not
  counted as evidence.
- `flutter build apk --release --no-pub`: FAIL on the invalid inherited Gradle path;
  even a successful compile would not be releasable because debug signing is configured.

## Verified gap matrix

| Area | Status | Evidence | Remaining work | Priority |
| --- | --- | --- | --- | --- |
| Supabase core | VERIFIED | Live health/search/404/RLS checks | Observability/backups | P1 |
| Auth code | PARTIAL | Unit/widget coverage | Beem + live E2E | P0 |
| Mobile endpoint | VERIFIED | Source now defaults to hosted facade | Device build/install | P0 |
| Marketplace browse | PARTIAL | Hosted empty search | Media and seeded acceptance data | P1 |
| Owner drafts | PARTIAL | Tests + hosted RPC | Live owner E2E/edit/photos | P1 |
| Rentals | BROKEN | No facade routes | Schema, locks, RPCs, tests | P0 |
| Storage/media | BROKEN | No Supabase implementation | Buckets, policies, processing | P1 |
| Release build | BLOCKED | Gradle failure + debug signing | Keystore and reproducible CI build | P0 |
| UI consistency | PARTIAL | Token layer plus source review | Dark/light cleanup and screen QA | P2 |
| Accessibility | NOT TESTED | Limited semantics only | TalkBack, scale, targets, contrast | P1 |

## Completion score

- Engineering readiness: 58%
- Functional coverage: 43%
- UI/UX completion: 56%
- Testing and QA: 48%
- Accessibility: 24%
- Performance readiness: 30%
- Security readiness: 57%
- Overall product readiness: 45%

The overall score is constrained by the unavailable registration channel, missing
rental core, absent media, lack of live-account/device E2E, and no releasable Android
build. Passing unit tests and a live partial backend do not outweigh those blockers.

# PRODUCT READINESS: NOT READY

Release blockers: Beem/live Auth; Supabase rentals and race-safe availability;
Storage/media; real-account Android E2E; reproducible signed release build; production
monitoring/backup/incident readiness; accessibility and responsive device QA.
