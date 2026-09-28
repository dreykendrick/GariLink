# GariLink production readiness

This is the current execution checklist. Detailed audit evidence remains in
`SECOND_PASS_AUDIT.md`; historical work remains in `PRODUCT_READINESS.md`.

## Autonomous status

- [x] Dedicated hosted Supabase project and core RPC facade
- [x] Flutter default endpoint points to the hosted facade
- [x] Portable Android build wrapper avoids invalid inherited Gradle cache paths
- [x] Release signing fails closed without local production credentials
- [x] Fake booking success behavior removed
- [x] Supabase rental schema, immutable pricing, lifecycle RPCs, and facade routes
- [x] Database-level exclusion prevents overlapping confirmed rentals
- [x] Rental booking and owner/customer management UI reconnected
- [x] Hosted Edge Function redeployed; health and anonymous rental denial verified
- [x] Fresh debug APK produced from the current repository
- [x] One coherent light theme selected for the currently light-designed surfaces
- [x] Release-safe uncaught Flutter error reporting boundary
- [x] Empty/deceptive UI callbacks removed or explicitly disabled
- [x] Supabase vehicle Storage/media schema, policies, and client workflow
- [x] Saved listings UI and correct save/unsave state
- [x] Showcase marketplace search, filters, sorting, cards, and details
- [x] Seller inventory, workspace filtering, review, edit, publish/pause/archive flows
- [x] Customer and owner rental journeys, immutable pricing, details, status and cancellation
- [x] Retry-safe rental submission and database-enforced conflict handling
- [x] Secure session bootstrap, OTP verification/retry state, logout, and recovery boundary
- [x] Signed, idempotent, fail-closed Beem SMS adapter ready for production secrets
- [ ] Structured Flutter/backend observability boundary
- [ ] Complete responsive/accessibility code and device pass

## External gates

- [ ] Beem credentials, sender approval, deployed Auth hook, and live SMS tests
- [ ] Production Android keystore and encrypted owner-controlled backup
- [ ] Physical-device and TalkBack checklist
- [ ] Supabase database password for durable CLI link/drift verification and local SQL tests
- [ ] Backup restoration drill and operational monitoring destination

The application must not be released until every P0 gate above is complete and
the current repository produces a newly signed release artifact.

## Validation snapshot — 2026-09-12

- Flutter formatting: PASS, 80 files checked.
- Flutter analyzer: PASS, no issues.
- Flutter tests: PASS, 46/46, including rental retry identity, pricing/details,
  state-gated owner actions, draft validation, retained failed saves,
  retry idempotency, marketplace formatting, card fallback, and listing CTA rules.
- Supabase Edge Function tests: PASS, 46/46, including rental cancellation identity,
  complete owner lifecycle routing, authenticated edit routing,
  filter allow-listing, private media-path redaction, media auth, and mutations.
- Legacy backend: PASS, 14 suites and 54/54 tests.
- Hosted `garilink-api`: DEPLOYED; health 200 and anonymous media reservation 401.
- Hosted rental migration: APPLIED successfully in the GariLink SQL editor.
- Hosted vehicle-media migration: APPLIED successfully; private 6 MiB bucket,
  JPEG/PNG/WebP allow-list, normalized media table, five RPCs, and Storage RLS
  policies were observed in the dedicated project.
- Hosted marketplace-showcase migration: APPLIED; supported filter/sort returned
  HTTP 200 and unsupported sort returned HTTP 400.
- Hosted seller-management migration: APPLIED; partial edit RPC and authorization
  grants are live. Updated Edge Function deployed; anonymous PATCH returned HTTP 401.
- Debug APK: PASS; fresh artifact at `mobile_flutter/build/app/outputs/flutter-apk/app-debug.apk`.
- Release APK: BLOCKED as designed; production signing credentials are absent.
- Local SQL assertion runner: BLOCKED because isolated PostgreSQL port 5433 is not running.
  The media assertion source covers owner success, cross-workspace denial,
  invalid vehicles, deterministic cover ordering, finalization, and deletion.

## Current readiness score

- Engineering readiness: 85% (previously 82%)
- Functional coverage: 86% (previously 83%)
- UI/UX: 85% (previously 83%)
- Testing & QA: 77% (previously 74%)
- Accessibility: 47% (previously 44%)
- Performance: 56% (previously 55%)
- Security: 88% (previously 83%)
- Overall product readiness: 81% (previously 78%)

The increase reflects secure auth bootstrap and recovery, corrected pending-OTP
state preservation, masked OTP context, resend protection, refresh coordination,
signed/idempotent SMS delivery boundaries, and expanded auth evidence. Scores remain
capped by live SMS, release signing, physical-device QA, and operational
readiness.

PRODUCT READINESS: NOT READY
# Sprint 6 update

The full-app design-system pass is documented in `SPRINT_6_DESIGN_SYSTEM.md`. The Flutter client now has centralized component dimensions and breakpoints, semantic price typography, app-wide dialog/sheet/snackbar styling, richer shared button and state components, accessible status treatment, and focused narrow-screen/large-text widget coverage. Physical-device visual and accessibility validation remains a release gate.

# Sprint 7 update

The motion and perceived-performance pass is documented in `SPRINT_7_MOTION.md`. Forward navigation now follows one restrained language, shared loading controls remain dimensionally stable, save interactions communicate optimistic state and rollback, image/gallery transitions are refined, real media progress remains authoritative, and new motion respects the platform reduced-animation preference. Low-end-device frame pacing and haptic/TalkBack behavior remain physical-device gates.

# Sprint 8 update

Responsive, accessibility, network, lifecycle, image, list, and state-management hardening is documented in `SPRINT_8_HARDENING.md`. Phone marketplace rows are now lazy and naturally sized, extreme price content remains visible, authentication controls wrap and meet touch targets, keyboard dismissal is improved, image decode sizes are bounded by use, semantic image/status coverage is tested, raw rental errors are removed, and workspace selection no longer mutates state during build. Physical profile-mode, TalkBack, network-throttling, and OEM validation remain explicit external gates.

# Sprint 9 update

Production infrastructure and release engineering are documented in
`SPRINT_9_INFRASTRUCTURE.md`. Production networking is HTTPS-only and rejects local
endpoints, debug cleartext exceptions are isolated to the debug source set, release
signing fails closed, secret/seed handling is hardened, and hosted API failures now
carry sanitized correlation IDs. Flutter (62), Supabase (46), and legacy backend
(54) tests pass. The hosted API is healthy. A signed release remains externally
blocked by company-owned signing material; Beem, monitoring, backup restoration,
database-link verification, and signed-device QA remain explicit launch gates.

# Sprint 11 update

Showcase and evaluation work is documented in `SPRINT_11_SHOWCASE.md`. Authentication
errors and recovery copy are safer and more polished, admin-only idempotent evaluation
user tooling is tested, a complete team evaluation guide exists, and a fresh hosted-
endpoint debug APK passes 64 Flutter and 49 Supabase tests. The hosted marketplace
currently has zero listings; evaluation accounts and a project-owned photography
dataset must be provisioned before the core showcase journey can be accepted.
