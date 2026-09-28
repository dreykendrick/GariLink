# GariLink production operations

## Asset ownership

| Asset | Account owner | Operational responsibility |
| --- | --- | --- |
| Supabase project/database/storage | GariLink company | Two company administrators; billing and recovery contacts current |
| Android upload keystore | GariLink company | Two encrypted offline backups; access logged and limited |
| Beem account/Sender ID | GariLink company | Funding, credential rotation, delivery escalation |
| Crash monitoring | GariLink company | Privacy review, alert routing, release health |
| Play Console | GariLink company | At least two administrators; staged rollout and update ownership |
| Privacy/support domain | GariLink company | Accurate public policy and support contact |

Avoid making any operational asset recoverable only from one developer laptop.

## Deployment order

1. Freeze and identify the source revision.
2. Review migration plan and create a verified backup/export.
3. Apply forward-only migrations and run SQL/security assertions.
4. Deploy Edge Functions and verify `/health` plus authenticated smoke tests.
5. Configure/verify secrets without exposing values.
6. Run client/server regression and create signed artifacts.
7. Smoke-test the signed release against production using controlled accounts.
8. Start staged rollout and monitor.

## Incident basics

- Crash spike: halt staged rollout, identify affected version, inspect sanitized events,
  mitigate server-side only where behavior remains safe, and ship a higher-version fix.
- API outage: verify Supabase health/function version, request IDs, database availability,
  and recent deployments. Do not log tokens or request bodies.
- Beem outage: keep verification fail-closed, inspect safe delivery events, verify account
  status with Beem, and communicate service unavailability without bypassing OTP.
- Failed migration: stop deployment, preserve evidence, assess backup, and prefer a new
  forward-fix migration. Never improvise destructive rollback against production.
- Broken mobile release: halt rollout. Mobile artifacts cannot be recalled reliably;
  publish a corrective build with a higher version code after regression.

## Logging and privacy

Use request IDs, event categories, route names, status codes, release/build number, and
non-PII internal user IDs only where needed. Never log authorization headers, request
bodies, passwords, OTPs, refresh/access tokens, full phone/email, signing credentials,
Beem credentials, service-role keys, or database URLs.

