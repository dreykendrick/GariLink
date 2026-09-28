# GariLink Android Team Demo QA — 2026-09-27

## A. Build Verdict

APK build PASS. Physical-device QA is blocked because ADB and Flutter detected no Android device.

## B. Source State

Built from the current `GariLink-main` working directory after Phase 4 certification. The directory is not an independent Git checkout: the nearest Git root is `C:/Users/kibaj`, has no repository commit, and reports the project as untracked. Therefore no reliable source commit/hash exists. No source was reset or discarded.

## C. Android Environment

- Flutter 3.41.7, Dart 3.11.5
- OpenJDK 21.0.8
- Android Gradle Plugin 8.11.1
- Gradle 8.14
- Kotlin 2.2.20
- compileSdk 36, targetSdk 36, minSdk 24
- Build cache redirected to `D:\garilink-gradle` because the configured `E:\flutter_cache\gradle` drive did not exist.

## D. Configuration Target

The compiled default is the hosted API at `https://yvcdkmsfuakjflmuatgz.supabase.co/functions/v1/garilink-api`. It does not use NestJS or a local backend. Release-mode configuration rejects local/non-HTTPS endpoints.

## E. Secret Audit

Source/configuration searches found no service-role key, `sb_secret_*`, Google Routes server key, Beem secret, signing password, admin credential, or controlled password in Flutter. Demo credentials are randomized and stored outside the repository at `C:\Users\kibaj\GariLink-Team-Demo-Credentials-2026-09-27.txt`. No privileged value was printed or bundled deliberately.

## F. Pre-Build Regression

- `dart format --set-exit-if-changed lib test`: 123 files, 0 changed, exit 0
- `flutter analyze --no-pub`: no issues, exit 0
- `flutter test --no-pub`: 159 passed, 0 failed, exit 0
- `npm test`: 94 passed, 0 failed, 0 skipped, exit 0

## G. Demo Data Readiness

Normal owner and renter login were verified. Three controlled, project-owned-media vehicles are published, AVAILABLE, discoverable, and requestable: two SUVs (including the Fleet fixture) and one medium cargo truck. No meeting request was pre-created.

## H. APK Build

Gradle `app:assembleDebug` completed successfully after a project-native clean and dependency regeneration. The artifact is an internal debug APK, not a Play Store or production-signed release.

## I. APK Metadata

- Label: GariLink
- Application ID: `ke.co.garilink.garilink_mobile`
- Version: `1.0.0+1`
- Native ABIs: arm64-v8a, armeabi-v7a, x86_64
- Permissions: INTERNET, ACCESS_NETWORK_STATE, COARSE_LOCATION, FINE_LOCATION, and Android's generated non-exported dynamic-receiver permission
- No contacts, microphone, SMS, phone-call, all-files, or background-location permission
- Cleartext disabled in main configuration; debug policy permits only local development hosts, while the compiled application default remains the hosted HTTPS API.

## J. Connected Device

`adb devices -l` returned zero devices. Flutter found Windows, Chrome, and Edge only. Android version/device model therefore unavailable.

## K. Installation Result

BLOCKED — NO CONNECTED DEVICE.

## L. First Launch

BLOCKED — NO CONNECTED DEVICE. Automated splash/onboarding test passes.

## M. Authentication

Hosted normal login PASS for controlled renter and owner. Physical login/session/logout/restart checks are blocked.

## N. Renter Home

Automated responsive/content tests PASS. Physical touch, scrolling, and visual inspection blocked.

## O. Transport Need

Passenger/cargo entry, validation, persistence, and responsive tests PASS. Physical keyboard/touch validation blocked.

## P. Location

Location permission declarations and manual-location contracts are present; denial/manual-fallback physical behavior blocked.

## Q. Discovery

Hosted discovery PASS with three requestable demo vehicles. Responsive cards, suitability, availability, fallback, and 100-vehicle lazy-list tests PASS. Physical scrolling/media observation blocked.

## R. Vehicle Detail

Automated passenger/cargo/busy states PASS. Physical gallery, signed-image rendering, scrolling, CTA, and back behavior blocked.

## S. Booking / Rental Request

Automated request flow and hosted Phase 4 certification PASS. No main meeting request was created. Physical flow blocked.

## T. Trips

Hosted renter lifecycle parity and Flutter presentation tests PASS. Physical refresh blocked.

## U. Owner Home

Workspace-scoped automated and hosted certification PASS. Physical inspection blocked.

## V. My Vehicles / Fleet

Fleet workspace, multiple vehicles, businessMode, and workspace scoping PASS hosted. Physical rendering blocked.

## W. Vehicle Operations

Hosted availability, pricing, publication, pause/republish, location, and media certification PASS. Demo vehicles restored to published/AVAILABLE.

## X. Incoming Requests

Hosted correct-workspace visibility and automated queue tests PASS. Physical presentation blocked.

## Y. Owner Acceptance

Hosted acceptance/conflict protection PASS from Phase 4 certification. New physical request/acceptance blocked.

## Z. Renter Acceptance Visibility

Hosted owner/renter parity PASS. Physical refresh blocked.

## AA. Full Rental Lifecycle

Hosted REQUESTED → APPROVED → READY_FOR_PICKUP → ACTIVE → COMPLETED PASS. No temporary ACTIVE rental remains. Physical replay blocked.

## AB. Fleet Regression

PASS: FLEET businessMode, multiple vehicle identity, request association, and cross-workspace denial were hosted-certified. Fleet Fortuner is published and requestable for the demo.

## AC. Android Back Navigation

BLOCKED — NO CONNECTED DEVICE.

## AD. Keyboard / Insets

Automated 320/390/600 px and 200% text coverage PASS; physical IME/inset validation blocked.

## AE. Background / Resume

Session/provider code tests PASS; physical background, lock, and resume blocked.

## AF. Network Recovery

Automated safe-error, retry, idempotency, and lost-response recovery PASS; physical airplane-mode test blocked.

## AG. Physical UI Findings

No physical findings can be claimed. Device-based small-screen, safe-area, image, and touch review remains required.

## AH. Performance Observations

Automated lazy-list/bounded async coverage PASS. No physical startup/jank measurements were possible.

## AI. Runtime Log Findings

No device runtime log was available. Build produced dependency namespace/source-level deprecation warnings only; no app compiler error.

## AJ. Bugs Discovered

No P0/P1 application defect. Environment blockers found: stale Gradle home on missing E: drive and insufficient C: space during the first native merge.

## AK. Bugs Fixed

No frozen application behavior changed. Build cache was redirected to D:, generated outputs were safely cleaned, and the build was rerun. Added secure reusable demo-preparation tooling.

## AL. Remaining Bugs

No known P0/P1 from automated/hosted evidence. P3 tooling debt: Gradle 9 compatibility deprecations and dependency manifest namespace warnings. Physical-runtime defects remain unknown until a device is tested.

## AM. Post-Fix Regression

No product fix occurred. Backend was rerun after demo tooling: 94/94 PASS. Flutter source did not change after its 159/159 PASS, clean analyzer, and formatter check.

## AN. Final APK Rebuild

PASS: `app:assembleDebug`, 250 actionable tasks, exit 0.

## AO. Final APK Path

`C:\Users\kibaj\Documents\Codex\2026-09-06\i-x20\work\GariLink-main\artifacts\GariLink-Team-Demo-2026-09-27.apk`

## AP. APK Size

91,591,658 bytes (87.35 MiB).

## AQ. SHA-256

`68B0CFD8C2F92799502F6A4AE3DDBE71982BACD839922D1B6BA6219AC5327804`

## AR. Build Mode / Signing State

Debug/internal QA build using Android debug signing. It is debuggable and not production signed.

## AS. Google Routes Limitation

Live Google Routes remains externally blocked by billing/card activation. The product fails closed: no fabricated/Haversine/PostGIS distance or estimate. Requests may continue without an estimate where the certified contract permits.

## AT. Final Demo Data State

Controlled renter/owner accounts are usable via the locally stored credential handoff. Three vehicles are published/AVAILABLE/requestable. Existing certification requests are terminal/cancelled; no temporary ACTIVE request exists.

## AU. Backup Demo Path

If live request creation is unavailable, use the retained controlled completed rental in Trips/Incoming Requests as lifecycle evidence and the three published vehicles for discovery/detail. This is hosted evidence, not an offline-data claim.

## AV. Meeting Demo Readiness

APK and hosted environment are ready for controlled installation. The remaining gate is physical-device installation and smoke QA; do not represent that gate as completed.

## AW. Final Verdict

ANDROID APK BUILD: SUCCESS

PHYSICAL QA: BLOCKED — NO CONNECTED DEVICE

GARILINK TEAM DEMO APK: READY
