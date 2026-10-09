# Email-first authentication — Sprint 2 local delivery

## 1. Architecture and dependency findings

Registration, recovery, pending-account storage, routing and SQL authorization previously depended on phone confirmation. Removing the router gate alone would not enable low-risk account actions safely. The implementation separates confirmed authentication from contact possession, while retaining protected mutation checks.

## 2. Files changed

Flutter:

- `lib/features/authentication/data/repositories/auth_repository.dart`
- `lib/features/authentication/data/models/user_model.dart`
- `lib/features/authentication/presentation/providers/auth_provider.dart`
- `lib/features/authentication/presentation/pages/register_page.dart`
- `lib/features/authentication/presentation/pages/email_confirmation_page.dart` (new)
- `lib/features/authentication/presentation/pages/forgot_password_page.dart`
- `lib/features/profile/presentation/pages/profile_page.dart`
- `lib/core/navigation/app_router.dart`
- `lib/core/services/storage_service.dart`
- `lib/core/services/api_client.dart`
- `android/app/src/main/AndroidManifest.xml`
- `test/email_auth_test.dart` (new)

Supabase:

- `functions/garilink-api/handler.ts`
- `functions/garilink-api/index.ts`
- `config.toml`
- `templates/confirmation.html` and `templates/recovery.html` (new)
- `migrations/20261009000000_email_first_preparation_access.sql` (new)
- `tests/email-auth-api.test.ts` (new)
- `tests/email-auth-assertions.sql` (new)
- `tests/run-local-sql.ps1`

Paths above are relative to `mobile_flutter/` or `supabase/` respectively. This report is also new.

## 3. Migration prepared

The additive migration introduces explicit preparation access, preserving workspace membership and existing function grants. Confirmed email or legitimate confirmed-phone accounts can use low-risk operations without requiring a phone. Draft preparation is distinguished from non-draft vehicle mutation. Publication, rental mutations and other sensitive paths retain temporary phone-confirmation controls.

It applies narrow, checked transformations to final RPC definitions rather than blindly replacing historical functions. Its SQL execution and clean-chain compatibility are NOT certified yet. No hosted migration was applied.

## 4. Authentication flow

Signup now requests only email and password. It records confirmation-pending state without inventing a session. Confirmation exchanges a Supabase token through the API and accepts only a confirmed server session. Existing secure session persistence, refresh and logout architecture remains in place.

## 5. Removed phone dependencies

Phone is no longer mandatory on signup or a global routing requirement for confirmed-email accounts. Absent/null user phone JSON maps safely to the existing empty-string compatibility representation. Profile display falls back to email. The prepared SQL change enables profile, saved vehicles, workspace and draft preparation without phone possession.

## 6. Intentional remaining restrictions

Legacy phone signup/login/recovery remain supported. Publication and rental mutations are not opened merely by email authentication. Existing live/non-draft vehicle editing retains protective checks. Future in-context phone binding, collision handling, KYC and role eligibility are not implemented by this sprint; auth/contact state is separated for that later work.

## 7. Confirmation and recovery

Confirmation has a pending page, resend cooldown and explicit link confirmation. Recovery uses a separate token type, validates the new password, updates it through Supabase and revokes the reset session before returning to login. Invalid/expired links receive friendly errors. Duplicate signup and unknown recovery accounts receive generic responses, while upstream rate limiting remains visible. Pending email survives restart and failed confirmation.

## 8. Existing-account compatibility

Legacy phone endpoints and pending-phone routing remain intact. Confirmed-phone sessions remain legitimate. No identities are merged using email, phone or profile metadata. No existing accounts are deleted or migrated locally. Actual hosted legacy account compatibility still requires smoke validation.

## 9. Security implications

Redirect configuration is allowlisted to the exact application callback. Confirmation and recovery token types cannot be interchanged. Public email endpoints do not attach a cached session or trigger session refresh. Recovery credentials/sessions are not persisted as login credentials. SQL preparation helpers retain tenant authorization, and sensitive checks remain distinct.

The Android custom scheme is not a verified HTTPS App Link: another installed app could register the same scheme. A verified-domain App Link remains a production hardening gate. Server rate limits and SMTP delivery must be validated in the target environment. No secrets are included in this report.

## 10. Verification

- `npm test` in `supabase`: 103 passed, 0 failed, 0 skipped; exit 0.
- `flutter test --no-pub`: 189 passed; exit 0, definitive completion.
- `dart format --set-exit-if-changed lib test`: 126 files, 0 changed; exit 0.
- `flutter analyze --no-pub`: no issues; exit 0.
- `flutter test --no-pub test/email_auth_test.dart test/pending_verification_test.dart`: 19 passed, 0 failed; exit 0.
- An earlier focused invocation named a nonexistent legacy test file and exited 1; this was a command-path error, not a failing product assertion. It was rerun with `test/pending_verification_test.dart`.
- Local SQL runner exited 1 because the approved test database at `127.0.0.1:5433` refused connection. No SQL assertions or migration were executed. Docker's engine was unavailable; another PostgreSQL service on 5432 could not be accessed with the available test credentials. It was not repurposed.

Mocked API tests do not certify hosted Supabase Auth, actual email delivery or PostgreSQL authorization.

## 11. Configuration requirements

Local Auth configuration enables email signup and confirmation and includes the application callback. Confirmation/recovery templates use token hashes, with explicit `signup` / `recovery` types.

API environment variable `GARILINK_AUTH_REDIRECT_URL` must equal `ke.co.garilink.garilink_mobile://auth/auth/email-callback`. Without it, email operations fail closed with a configuration error. The target Auth redirect allowlist and supplied email templates must be configured together after authorization. Default implicit-token email callbacks are not implemented by this flow; do not deploy it with mismatched templates. SMTP delivery and abuse controls require real environment validation.

## 12. Deployment and rollback

First restore an isolated local database and execute the complete migration chain and authorization assertions. Resolve any defect and rerun regression. Then, only with explicit hosted authorization: review pending migrations, apply the additive migration, configure approved Auth redirects/templates, and deploy the matching API. Perform real email/legacy smoke flows before releasing the matching Flutter client. Do not ship the client ahead of backend/configuration readiness.

Keep the prior application/API build available. Roll back client/API rollout if necessary; do not reset data or rewrite migration history. Any database rollback must use a reviewed forward migration restoring intended authorization bodies rather than blanket helper changes.

## 13. Outstanding blockers

Local SQL and clean-chain execution are unverified because the isolated test database is unavailable. Real Supabase confirmation/recovery, SMTP delivery, hosted authorization and physical Android deep-link flows remain untested. No hosted settings, database, Edge Functions, real email/SMS, remote repository or APK were changed by this sprint. Implementation is local; production certification is incomplete.

## 14. Physical Android checklist

- Signup at 320/360/390/430/600 widths, 200% text, keyboard visible, password toggle and focus progression.
- Pending confirmation survives restart; resend respects cooldown and server limits.
- Cold/warm confirmation links, successful exchange, expired/used/invalid links, back navigation and account switching.
- Recovery success/expiry/type mismatch; old sessions rejected as configured; normal login after reset.
- Confirmed-email user with no phone browses, edits profile, saves vehicles, creates authorized workspace/draft and prepares gallery.
- Protected publication/rental actions remain denied with understandable messages; cross-workspace access denied.
- Legacy confirmed-phone login, pending signup, recovery, session restoration, refresh and logout.
- No router loops, raw errors, private token display or unrelated renter/owner regressions.

## Verdict

Local implementation and automated Flutter/API regression are complete. SQL, real Auth and physical-device certification remain outstanding. Stop before hosted deployment.
