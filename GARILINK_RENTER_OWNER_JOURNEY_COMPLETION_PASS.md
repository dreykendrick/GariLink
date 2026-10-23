# Renter and owner journey improvement pass

## 1. Protected baseline

Local branch `codex/renter-owner-journeys` was created from `65f312c` without resetting/checking out files or creating a worktree. It retains the existing product/auth implementation and additive CI history; this is not a rewrite from an older baseline. PR #1's branch/ref was not modified. Generated backend/dist changes, uncommitted verification UI/tests, prior reports/logs and assets remain intact. No staging, commits, push, build, hosted transaction or deployment occurred.

## 2. Renter journey audit

| Stage | Implemented behavior inspected | Evidence/boundary |
| --- | --- | --- |
| Home / purpose | Five approved purposes, intent construction and existing photographic/premium UI | Preserved; existing Home regression retained |
| Explore | Debounced search, filters/sort, saved controls, nearby/matched discovery, loading/retry/empty | Fixed public query loss on tab page replacement; existing debounce/API behavior preserved |
| Vehicle | Details, gallery, capability/specification/suitability/price presentation and requestability controls | Fixed specification overflow; existing no-pricing/unavailable/sale behavior tests retained |
| Request | Future dates, TransportNeed/location, server estimate, retry request ID, submit progress/error and success navigation to Trips | Existing implementation retained, no real request sent |
| Trips / status | Repository-backed list, refresh/retry/empty, detailed customer status, cancellation confirmation | Existing status/model/widget tests retained; no production mutation |

The route graph uses GoRouter tab replacement and pushed detail/request routes; ordinary local widget tests can validate navigation/state without Docker. Existing auth/session redirects and real server-authoritative request validation are not replaced with UI approval. Code presence and unit tests are not hosted journey certification.

## 3. Owner/fleet journey audit

Dashboard/workspace context → authorized inventory → draft create/edit → vehicle gallery → availability/publication readiness → incoming request queues → rental details/actions are implemented across owner pages, operator-workspace provider, draft/media repositories and rental repository. Existing tests cover workspace response isolation, forms, media, statuses, queue sorting, terminal actions, empty/error states and recovery copy. Draft creation refreshes actual server roles rather than manufacturing owner privileges.

Incoming requests invalidated the workspace context before reading its selected workspace on resume. The selected ID is now captured first and that queue is invalidated explicitly. A lifecycle widget test verifies requests reload for the selected workspace. Existing owner/workspace authorization and action gating remain unchanged.

The owner menu still deliberately disables unsupported Business Profile, Payment & Payouts, Team Management, Subscription and support entries. No fake destination or backend implementation was added.

## 4. Issues and local fixes

- P1 usability: Explore query/controller were initialized from page-local defaults; tab replacement discarded search/filters/sort. A session-only public `exploreQueryProvider` now retains query preferences, with local debounced execution preserved. Typing is remembered even if navigation occurs before debounce finishes. Clear actions cancel pending debounce to prevent stale text reappearing. New Home intent still starts a fresh local search. No query is persisted across app restarts and no booking identity or private evidence is stored here.
- P1 accessibility: fixed-height specification grid overflowed at 200% text. New tests demonstrated five failing widths. Large-text cards now size to content in a single column; normal typography retains the existing two/three-column grid. No text scaling is disabled and no clipping bypass added.
- Owner refresh reliability: selected workspace captured before invalidating context; regression checks resume fetch. This is scoped lifecycle ordering, not a new permission model.

No P0 defect was demonstrated in this local pass. This is a focused improvement pass, not a declaration that every remaining journey issue is fixed.

## 5. Files changed

- `mobile_flutter/lib/features/explore/presentation/providers/explore_provider.dart`
- `mobile_flutter/lib/features/explore/presentation/pages/explore_page.dart`
- `mobile_flutter/lib/features/vehicle/presentation/pages/vehicle_details_page.dart`
- `mobile_flutter/lib/features/owner/presentation/pages/incoming_requests_page.dart`
- `mobile_flutter/test/marketplace_showcase_test.dart`
- `mobile_flutter/test/vehicle_detail_experience_test.dart`
- `mobile_flutter/test/owner_rental_operations_test.dart`
- This report.

No Supabase/backend/auth behavior, migration, Edge Function, premium Home layout, photo asset or menu behavior changed.

## 6. Tests

13 new tests: two Explore page replacement/debounce cases, five specification widths at 200%, five owner queue widths at actual 200%, and selected-workspace resume refresh. Local test doubles isolate listing, saved and workspace/rental reads. No tests connect to hosted Supabase.

- Focused three-file suite: 42 passed, 0 failed, exit 0.
- Supabase API/Node suite: 107 passed, 0 failed, 0 skipped, exit 0.
- Formatter verification: 129 files, 0 changes, exit 0.
- Initial focused runs exposed five overflow failures, then one remaining narrow-screen overflow. Those were fixed with content-sized layout, not ignored or assertions removed.
- Full Flutter regression: 205 passed, 0 failed; definitive exit 0 (2m12s reported test runtime).
- Final Flutter analyzer: no issues, exit 0 (59.9s).

## 7. Certification boundaries

Canonical migrations and real-platform smoke have passed CI. The full seven-suite authorization matrix still stops at stand-in Auth-schema actor-check setup; email-only SQL access assertions have not completed. Actual confirmation/recovery/refresh/SMTP, Android App Links, real Storage lifecycle/private documents and KYC remain independent gates. This pass does not deploy or certify them.

## 8. Remaining product gaps

- Confirm physical-device keyboard/back/large-text behavior; local widget layout tests are not full device QA.
- Review return-to-request intent after login: current Login explicitly goes Home and router protects Booking by redirecting to login; automatic restoration of an interrupted request is not implemented by this pass. Keep any future resume scope tied to current user/session and revalidate authoritative eligibility before submit.
- Nearby/TransportNeed context currently belongs to route intent/panel state. The new query persistence covers public text/filter/sort, not full route/location persistence or app-kill restoration. Do not advertise it as complete journey persistence.
- Unsupported owner menu features remain honest disabled entries.
- Separate seller-management SQL assertion file is not in the seven-suite harness.
- Production email-first rollout and real verification flows remain blocked by certification/configuration, not by missing frontend preview decoration.

## 9. Next practical product sprint

Implement scoped post-login return-to-vehicle/request navigation and tests, without automatically submitting a request. Then review route-intent restoration and owner populated queue/actions under increased text/keyboard conditions. Preserve server eligibility/pricing/workspace rules and keep private verification backend work separate. Do not expand into payments/subscriptions or rebuild the Home.

## 10. Internal QA build readiness

No APK built in this task. A local internal test build can be considered after final regressions, but installation/signing/toolchain success has not been verified here. Current client email-first preparation must not be described as working against an undeployed/unconfigured hosted backend. Use an explicitly isolated/test-double environment for new auth functionality, or separately authorize the required configuration/certification first. Physical-device visual and Auth link checks remain required. Production/release readiness is not established.
