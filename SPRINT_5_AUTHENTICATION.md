# Sprint 5 — Authentication, OTP, sessions, and account access

Completed 2026-09-12. Live Beem validation is externally blocked.

## Architecture

- Flutter owns one Riverpod authentication state and restores it before routing.
- Access and refresh tokens are stored only in Flutter Secure Storage. Onboarding is a separate non-sensitive preference and survives logout.
- The API validates identity with Supabase Auth, never accepts actor identity from request bodies, and sanitizes provider/auth errors.
- Concurrent expired requests share one refresh operation. Revoked/expired sessions clear secure credentials and private state.
- Registration persists a pending phone without creating a fake session. OTP verification must return authoritative Supabase tokens before authentication succeeds.

## OTP and recovery

- Tanzanian `06`/`07`, `2556`/`2557`, and `+2556`/`+2557` inputs normalize to canonical E.164; malformed and foreign numbers are rejected.
- OTP entry is numeric, six-character bounded, autofill-compatible, accessible, and protected from duplicate verification.
- The destination is masked. Resend has a 60-second presentation cooldown; Supabase Auth remains authoritative for OTP expiry, attempts, and server throttling.
- Pending verification survives restart, resend, incorrect code, and recoverable network failure. Successful verification clears temporary state exactly once.
- Password recovery verifies a Supabase SMS code, updates the password, globally logs out the temporary recovery session, and returns to login.

## Beem boundary

`beem-sms` is a server-only signed Supabase Auth Send SMS hook. It validates webhook signatures and timestamp freshness, rejects oversized/tampered requests, reserves delivery idempotently in a service-role ledger, applies bounded HTTPS delivery with no redirects, and sanitizes provider failures. Flutter never receives Beem credentials or OTP values.

Required hosted secrets: `BEEM_API_KEY`, `BEEM_SECRET_KEY`, `BEEM_SENDER_ID`, and `SEND_SMS_HOOK_SECRET`.

## Security and verification

- No OTP, password, token, Authorization header, Beem credential, or full phone logging was found in production paths.
- Provider-independent Supabase/API tests: 46/46 passed; the first 25 cover auth, phone, Beem delivery, signed hooks, replay/idempotency, failures, and ledger fail-closed behavior.
- Flutter tests: 46/46 passed, including phone normalization, pending verification persistence, failed OTP retry, real-session installation, late-operation cancellation, session refresh coordination, logout races, and onboarding routing.
- Analyzer: no issues.
- Fresh debug APK: 183,250,277 bytes; SHA-256 `1816FC2A8EB63E8D3D96229B71547C6DBA93030487B499712ECE2C40FF64F9E6`.

## External validation

The founder must obtain approved Beem credentials/Sender ID, configure protected Supabase secrets and the Auth Send SMS hook, deploy `beem-sms`, then validate registration, resend, expiry, wrong-code, recovery, provider failure, and account switching with a controlled Tanzanian number on physical Android hardware.
