# Sprint 2.1 — Local SQL and authentication certification

Date: 2026-10-09. Recommendation: **NO-GO for hosted deployment**.

### Sprint 2.2 infrastructure recheck

Rechecked after the updated Sprint 2.2 brief: session remains non-administrator; Docker CLI 29.7.2 still cannot connect to the engine pipe; required Docker Desktop registry entry remains absent; no Docker process is running. WSL reports no installed distributions and unavailable Windows platform support. Supabase CLI remains 2.114.0. Approved port 5433 still has no response. No installation, feature change, reboot, database operation or application change was attempted at this administrator boundary. Regression suites were not rerun in this recheck; the counts below are the previously executed Sprint 2.1 results, not new Sprint 2.2 evidence. Migration/SQL certification remains NOT CERTIFIED.

## 1. Local database environment

The approved SQL harness targets only `127.0.0.1:5433`, database `garilink_dev`. `pg_isready` reports no response. Running `powershell -NoProfile -File tests/run-local-sql.ps1` exits 1 with connection refused before any SQL executes. No database was reset, altered or repurposed.

Docker CLI 29.7.2 is present, but `docker info` fails because the engine pipe does not exist. A hidden Docker Desktop launch was attempted. Its host log reports: `cannot find registry key "SOFTWARE\\Docker Inc.\\Docker Desktop"`. No Docker process remained running; Winget reports no matching Docker Desktop installation. This is a broken/incomplete installation, not merely an unavailable test container.

WSL 2.6.1.0 and its kernel are installed. `wsl --status` reports required Windows features unavailable. Processor diagnostics report firmware virtualization and SLAT enabled. Reading Windows optional-feature status requires elevation and was denied, so exact feature state is unconfirmed. No features were changed or reboot initiated.

Native PostgreSQL 18 is installed and a separate service is running. PostGIS extension files are absent from that installation. It was not used: it is not the approved isolated environment and cannot execute the PostGIS migration dependency as supplied.

Minimum recovery action: an administrator must repair/install Docker Desktop and confirm WSL/VirtualMachinePlatform features are enabled (reboot only if requested by Windows), then allow Docker Desktop initialization until `docker info` succeeds. Installation/feature repair cannot be completed silently with the current unelevated access. This report does not claim that enabling BIOS virtualization is necessary; it was already reported enabled.

## 2. Canonical migrations

The pending migration remains `20261009000000_email_first_preparation_access.sql`, unchanged in this pass. Static inspection confirms explicitly qualified relations, empty search paths on new SECURITY DEFINER helpers, revoked client execution on private helpers, an explicit RPC transformation allowlist, and fail-closed checks when expected function bodies are absent. Sensitive phone checks remain default behavior.

These observations are NOT execution evidence. Full migration order, function replacement compatibility, grants, RLS, indexes and vehicle/rental RPC behavior are **NOT CERTIFIED** because the complete chain did not execute. Do not deploy the pending migration on the strength of static inspection or HTTP mocks.

## 3. SQL authorization assertions

Existing rollback fixtures and email assertions were inspected. The fixture intentionally supplies minimal Auth/Storage stand-ins; it is not an Auth emulator. The email assertions cover confirmed-email/no-phone profile/history/saved reads, workspace/draft creation, sensitive publication/rental rejection, direct-write rejection and cross-workspace access.

Executed SQL assertions: **0**. All required identities and policy scenarios, including unconfirmed/anonymous accounts, legacy contact possession, authorized owner, nonmember and unauthorized member, are **NOT CERTIFIED** in PostgreSQL. After environment recovery, execute the complete chain and expand/verify the scenario matrix where existing assertions do not cover a required case. Run against both the stand-in harness and the isolated Supabase stack for actual platform policy/grant compatibility. Do not weaken assertions or substitute mocked API results.

## 4. Regression results

| Command | Result | Exit |
| --- | --- | --- |
| `npm test` (Supabase) | 103 passed, 0 failed, 0 skipped | 0 |
| `flutter test --no-pub test/email_auth_test.dart test/pending_verification_test.dart test/api_client_test.dart` | 27 passed, 0 failed | 0 |
| `flutter test --no-pub` | 189 passed, 0 failed; definitive final summary | 0 |
| `dart format --set-exit-if-changed lib test` | 126 files, 0 changes | 0 |
| `flutter analyze --no-pub` | No issues | 0 |
| SQL harness | Connection refused; no assertions executed | 1 |

No application/schema changes were made in this pass. One diagnostic `rg` wildcard command was rejected by Windows path parsing; it did not run tests or change files.

## 5. Deep-link security

Current manifest restricts the custom scheme to host `auth` and exact path `/auth/email-callback`. Router accepts only `signup` and `recovery` types and requires a token hash. Server endpoints force the corresponding Supabase verification type, so client type selection cannot turn a recovery token into signup verification. Replay/expiry enforcement is delegated to Supabase; expired-token handling is covered by mocked API tests, not real token replay certification.

Callbacks remain available during cold-start hydration, but action buttons wait for hydration. Confirmation is explicit rather than automatic account switching. Pending email is persisted separately from a real session; reset sessions are not persisted. Reset updates the password, requests global session logout and returns to login.

Security gaps/gates:

- The custom scheme can be registered by another installed application. It is not verified HTTPS domain ownership.
- Token hashes are bearer credentials: callback URIs must be excluded/redacted from telemetry, proxy logs, screenshots and crash reports. Request-error logs inspected contain route/status/type rather than bodies; device/platform URI logging has not been certified.
- Real Supabase one-time token replay, reset revocation semantics and cold/warm Android delivery remain untested. Global logout does not establish immediate revocation of every previously issued JWT; existing API session checks and platform expiry behavior require integration validation.
- Recovery can consume the token before a subsequent password update/network failure; retry may require a new email. Do not assume all partial failures are retryable with the same token.

### Verified HTTPS App Links transition

No actual manifest/domain/redirect changes are safe yet: owned callback domain and approved signing fingerprints have not been verified. Do not guess them or generate an assetlinks file.

After those inputs are verified, prepare a separate VIEW/DEFAULT/BROWSABLE filter with `android:autoVerify="true"`, HTTPS, the approved host and exact `/auth/email-callback` path. Keep the path contract so the existing route can serve the HTTPS callback. Update the API's exact redirect allowlist, environment, local Auth redirects and email templates together; it currently accepts only the custom scheme and must not be loosened into an arbitrary redirect.

Publish Digital Asset Links only after verifying the Android application ID and the actual installation signing certificate SHA-256 (including Play app-signing identity where relevant). Serve it at the approved host's `/.well-known/assetlinks.json`, then verify on Android using `adb shell pm verify-app-links --re-verify <application-id>` and `adb shell pm get-app-links <application-id>`. Test both confirmation and recovery cold/warm callbacks before phasing out legacy custom-scheme links.

Reference: [Android App Links verification](https://developer.android.com/training/app-links/verify-applinks). This is a transition plan, not a claim of verified App Links.

## 6. Legacy compatibility

Legacy login/recovery endpoints and pending-phone routing remain unchanged. Existing pending verification, session/storage and API client regression tests passed. These are automated contract evidence; real legacy Auth login, restoration, refresh, recovery and access against Supabase remain **NOT CERTIFIED** in this pass.

## 7. Hosted configuration requirements

Explicit deployment authorization is still required. Configure confirmed email signup, approved redirects, supplied token-hash confirmation/recovery templates, SMTP and Auth rate limits. Set `GARILINK_AUTH_REDIRECT_URL` to the currently supported exact callback until an approved HTTPS transition is implemented. Default implicit-token callbacks are not compatible with this token-hash implementation. No real email/SMS was sent.

## 8. Safe deployment order

Restore isolated tooling; certify the clean chain and full SQL identity/policy matrix; fix only demonstrated defects and rerun affected/full regressions. Then obtain hosted authorization, review migration state, apply the additive migration, coordinate Auth settings/templates and matching Edge API, execute real Auth/security smoke tests, and release the client only when contracts align. No hosted operations occurred here.

## 9. Rollback

Retain previous client/API builds. Revert application rollout if required; use a reviewed forward SQL migration for authorization changes. Never reset data or rewrite migration history as a rollback. Do not fall back to a globally permissive auth helper. Preserve existing legacy account contracts throughout rollout.

## 10. Recommendation

**NO-GO.** Flutter/API regression is green, but the required canonical migration and actual SQL/RLS assertions could not execute. This is an environment certification blocker, not evidence that the SQL passed or failed. Domain/signing inputs and physical real-token callback validation also remain outstanding. No release artifacts, remote push, hosted migrations/settings, Edge deployment or account deletion were performed.
