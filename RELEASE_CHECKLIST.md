# GariLink production release checklist

Record the operator, UTC timestamp, git revision, Flutter version, app version,
environment, artifact hashes, and evidence link for each release. Never record
secret values in this file.

## Ownership and prerequisites

- [ ] Founder/company confirms permanent package ID `ke.co.garilink.garilink_mobile`.
- [ ] Company-controlled Play Console application exists for the package ID.
- [ ] Company-controlled upload keystore exists with two encrypted backups.
- [ ] Monitoring project is company-owned and its privacy configuration is approved.
- [ ] Beem account is funded, Sender ID approved, and credentials are available.
- [ ] Supabase project ownership and billing contacts have at least two administrators.

## Configuration and data safety

- [ ] Confirm production `API_BASE_URL` is the HTTPS GariLink Supabase function URL.
- [ ] Confirm Beem and SMS-hook secrets exist using `supabase secrets list`; never print values.
- [ ] Confirm `garilink-api` and `beem-sms` deployed versions match reviewed source.
- [ ] Confirm migration history matches committed migrations; stop on unexplained drift.
- [ ] Create and verify a pre-release backup/export outside the repository.
- [ ] Confirm RLS, RPC grants, Storage bucket privacy, and function JWT checks using tests.
- [ ] Confirm monitoring release/environment metadata and PII scrubbing.

## Quality gate

- [ ] `flutter pub get`
- [ ] `dart format --output=none --set-exit-if-changed lib test`
- [ ] `flutter analyze --no-pub`
- [ ] `flutter test --no-pub`
- [ ] `npm test` in `supabase/`
- [ ] `npm run build` and `npm test -- --runInBand` in `backend/`
- [ ] Review dependency audit output; document rather than force major upgrades.

## Version and signed artifacts

- [ ] Increment `version: MAJOR.MINOR.PATCH+BUILD` in `mobile_flutter/pubspec.yaml`.
- [ ] Confirm BUILD is greater than every Play Console version code.
- [ ] Supply ignored `android/key.properties` or protected `GARILINK_KEYSTORE_*` variables.
- [ ] `flutter build appbundle --release --dart-define=APP_ENV=production`
- [ ] Optionally `flutter build apk --release --dart-define=APP_ENV=production` for direct QA.
- [ ] Record AAB/APK byte size and SHA-256; verify certificate and package identity.
- [ ] Confirm release build contains no localhost/cleartext route, debug signing, or debug banner.

## Smoke test and rollout

- [ ] Execute `DEVICE_QA_CHECKLIST.md` against the signed release and production backend.
- [ ] Validate registration, real Beem OTP, login, marketplace, save, rental, owner, and upload.
- [ ] Send one controlled monitoring test event containing no PII or credentials.
- [ ] Start a staged Play rollout; monitor crash rate, auth, SMS, API, and database health.
- [ ] Halt rollout on a serious regression; use a corrective higher-version build.

