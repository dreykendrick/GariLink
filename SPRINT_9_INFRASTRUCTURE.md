# Sprint 9 — Production infrastructure and Android release engineering

Validated on 2026-09-12 against Supabase project `yvcdkmsfuakjflmuatgz`.

## Implemented

- Android release signing is fail-closed. Release builds require an owner-provided
  keystore and credentials; debug signing is never substituted.
- Production builds default to the hosted HTTPS Supabase API and reject HTTP,
  localhost, loopback, and Android-emulator host URLs.
- Cleartext networking is disabled in the production manifest. A narrowly scoped
  localhost exception exists only in the debug source set.
- Keystores, signing properties, private keys, service-account files, and local
  environment files are excluded from version control.
- Legacy seed accounts require environment-provided passwords, refuse production
  execution, and do not print credentials or phone numbers.
- Edge Functions return correlation IDs and emit structured, sanitized failure
  events without request bodies, tokens, phone numbers, OTPs, or provider payloads.
- Release, operations, environment/secrets, backup/restore, and device-QA runbooks
  are present at the repository root.

## Hosted evidence

- Project status: `ACTIVE_HEALTHY`, region `eu-west-1`.
- `garilink-api` version 8 deployed and active.
- Hosted health endpoint returned HTTP 200 with backend `supabase` and payment mode
  `OFF_PLATFORM`; the response included a unique `X-Request-Id`.
- `beem-sms` is source-ready but is not deployed. Its required Beem and hook secrets
  are not configured in the project.

## Security posture

- Eight ordered SQL migrations are present. Tables enable RLS and revoke direct
  anonymous/authenticated table access; bounded RPC grants provide the API surface.
- The `vehicle-media` bucket is private, limited to 6 MiB JPEG/PNG/WebP objects,
  with authenticated owner-scoped insert/update/delete policies.
- Repository secret scanning found no current private-key blocks, service-role JWTs,
  or hardcoded known seed passwords. Previously committed test credentials must be
  treated as compromised and never reused.
- Production dependency audit: Supabase package has 0 known vulnerabilities. The
  retired Nest backend has 20 production findings (2 low, 11 moderate, 7 high) and
  must not be deployed.

## Verification

- `dart format lib test`: 88 files, no changes.
- `flutter analyze --no-pub`: no issues.
- `flutter test --no-pub`: 62/62 passed.
- Supabase tests: 46/46 passed.
- Legacy Nest build: passed; tests: 14 suites, 54/54 passed.
- Debug APK: 183,259,557 bytes (174.77 MiB), SHA-256
  `092B3F8A22B1F9232231904EA08940940B002929BA18C8B0313CBF14BF45ADA4`.
- Genuine release AAB attempt: intentionally stopped by the signing preflight because
  production signing credentials are absent. No misleading release artifact exists.

## External release gates

1. Company-owned Android keystore, credentials, and encrypted recovery copy.
2. Permanent package/application ID decision and Play Console ownership.
3. Beem credentials, approved sender, deployed signed Auth hook, and live OTP tests.
4. Monitoring account/provider configuration and a verified test event.
5. Supabase backup entitlement confirmation and an isolated restore drill.
6. Database password for durable CLI linking and hosted migration-drift verification.
7. Signed-build physical-device, upgrade, TalkBack, poor-network, and lifecycle QA.

Until these gates are complete, GariLink is engineering-prepared but not releasable.
