# GariLink: full Supabase migration

Status: IN PROGRESS. Dedicated hosted project `yvcdkmsfuakjflmuatgz` (GariLink,
`eu-west-1`) was created on 2026-09-11 and observed healthy, but this is not a
deployed replacement for `backend/` yet.
The existing Flutter build must keep its current API URL until contract and
device tests pass. No production database has been changed by adding these files.

## Confirmed product decisions (2026-09-08)

- Full Supabase backend: Auth, Postgres, Storage, and Edge Functions; no separate NestJS host.
- Beem sends SMS through a signed Supabase Auth Send SMS hook.
- Rental payments are arranged outside GariLink. Booking approval must never be
  displayed as proof of payment. No checkout or payment-collection integration.
- Preserve the existing backend and data while developing the replacement.

## Architecture and safety

`garilink-api` is the mobile HTTP facade. It uses the caller's Supabase access token
for narrow Postgres RPCs, not an administrative/service-role client. Public auth
routes call Supabase Auth. Phone verification is enforced by Supabase Auth before
issuing a usable signed-in session. Flutter now supports a pending-verification
response without fake tokens, persists the phone securely across restarts, and
installs the real session after verification. Legacy auth responses remain
supported until cutover. Eight new mobile tests await a user-side Flutter run.

Native tables use `gl_` names to avoid silently overwriting existing Prisma tables.
Auth UUIDs are canonical. Existing user/vehicle/workspace IDs and media must be
mapped by a reviewed import, not by automatic phone matching during signup.
Legacy sessions and OTPs must not be copied. Do not run a database reset on an
existing project. The migration does not automatically adopt existing Auth users.

All new identity tables have RLS enabled and no direct client grants. Only narrow
RPCs expose the caller's own safe profile fields. Client-supplied signup metadata
cannot set roles, verification, capabilities, or account status.

## Beem setup (after test deployment is approved)

1. Set `BEEM_API_KEY`, `BEEM_SECRET_KEY`, and your approved `BEEM_SENDER_ID` in
   Supabase Edge Function secrets. Do not put them in Flutter, screenshots, or chat.
2. Deploy `beem-sms` with the checked-in `verify_jwt = false` setting. It is a
   signed webhook, not an unauthenticated SMS API: every body is verified with
   Standard Webhooks before any send.
3. In Supabase Auth Hooks, configure Send SMS to call
   `https://<project-ref>.supabase.co/functions/v1/beem-sms`. Store the generated
   signing secret as `SEND_SMS_HOOK_SECRET`.
4. Enable phone/password signup and phone confirmation; use 6-digit OTPs,
   10-minute expiry, 60-second resend cooldown, appropriate SMS rate limits,
   CAPTCHA/abuse controls, and Beem spending alerts.
5. Test with an authorized phone and funded Beem account. A successful API response
   means submitted for processing, not proof of delivery to the device.

The hook retains TLS verification, refuses redirects, caps its body size, bounds
provider latency, and never logs phone numbers, OTPs, or credentials. It does not
automatically retry a provider timeout because that could duplicate a billed SMS.
The hook uses a durable Postgres claim keyed by the signed webhook ID. Accepted
retries return success without another send; uncertain sends fail closed and the
user must request a fresh code. The ledger retains no phone number or OTP, uses
bounded cleanup, and is callable only with the server's service-role credential.
Only the SMS hook uses this credential; the application API remains caller-scoped.

Workspace create/list/read/update RPCs are implemented with active membership,
owner/manager writes, verified-account checks, and immutable owner/verification
fields. Creation requires a client UUID `requestId`; identical retries return the
same workspace and changed payloads conflict. It grants the private-owner role
without granting admin or reactivating suspended/revoked capabilities. Member
invitation/removal is not migrated yet. The initial mobile owner-creation form is
implemented behind a disabled-by-default migration flag (see below).

## Marketplace and owner drafts (2026-09-09)

The fourth migration adds native vehicles, listings and per-account saves. Raw
tables have RLS and no client grants. Public search/detail projections exclude
unpublished/expired listings and inactive or banned owners. Private inventory and
mutations verify current account/session, workspace access and active/unexpired
capabilities. Supplied IDs cannot substitute for the authenticated caller.

Implemented facade routes:

| Routes | Behavior |
| --- | --- |
| `GET /listings`, `GET /listings/{id}` | Public published listings; bounded page/limit, text/location/type/price filters; hire price means daily rate |
| `GET /listings/mine` | Caller-accessible workspace inventory, including drafts |
| `POST /listings/drafts` | Create vehicle and draft atomically; same caller/request UUID and payload return the existing result; changed payload conflicts |
| `POST /listings/{id}/publish`, `/pause`, `/archive` | Row-locked, capability-checked lifecycle; publication lasts 30 days; expired publication can be renewed |
| `GET /vehicles/{id}`, `GET /vehicles/workspace/{id}` | Workspace-authorized vehicle reads |
| `POST /listings/{id}/save`, `DELETE /listings/{id}/save` | Explicit saved/unsaved state, safe to retry; no cross-account writes |
| `GET /listings/saved` | Only this account's currently public saved listings |

Draft input is `{requestId, workspaceId, type, title, description?, county, price,
vehicle: {make, model, year, mileage, type, fuelType, transmission, condition}}`.
Currency is TZS. Conditions retain the existing NEW/FOREIGN_USED/LOCAL_USED/SALVAGE
values. This is the initial creation contract, **not a complete legacy-data
importer**: advanced specifications, private VIN/registration/tracking, images,
rental terms, contact/analytics and related records still need migration. No
existing vehicle or listing has been imported or altered by these tests.

The Flutter main + button and My listings screen gain an Add vehicle form, existing-workspace
selection or personal-workspace creation, explicit private-draft messaging,
validation, loading/errors, input retention and same-payload retry IDs. Status
actions now track busy state per listing and invalidate public search after changes.
Unavailable view/contact metrics display a dash, not a fabricated zero. Inventory
network failures are no longer reported as a successful empty vehicle list.
The main + entry allows a verified customer to create their first workspace without
needing an owner role first, then refreshes their real server-issued account roles.

The form is gated by `--dart-define=ENABLE_SUPABASE_OWNER_TOOLS=true`; leave it off
for the legacy API. Enable it **only in a test build** after deploying/validating
the migrated facade and setting `API_BASE_URL` to
`https://<project-ref>.supabase.co/functions/v1/garilink-api`. No default API URL or
installed APK was changed. The gate is release control, not authorization (SQL
enforces authorization independently).

Limitations: drafts cannot yet be edited or given uploaded photos; saved-list UI
is not connected; owner/saved inventory needs pagination; rental booking/terms and
availability remain unmigrated. Publication currently permits listings without
photos. Form retry IDs survive retries within the page, not app termination—after
an uncertain request and reopening the form, check My listings before resubmitting.
Do not enable production cutover until these gaps and the full migration checklist
are resolved. Database row locks are implemented; concurrent multi-session tests
of the new marketplace RPCs are still required (the SQL fixture is sequential).

## Migration checklist

- [x] Create a separate project and confirm its reference; GariLink starts empty.
- [ ] Test native identity SQL against a local/full Supabase instance.
- [ ] Complete API auth/profile compatibility and Flutter pending-verification flow.
- [ ] Migrate workspace/member authorization and owner onboarding.
- [ ] Migrate vehicle/listing/search/saved/contact/analytics endpoints.
- [ ] Migrate atomic rental transitions and availability locks; rerun race tests.
- [ ] Migrate organizations, invitations, verification and audit records.
- [ ] Implement Supabase Storage upload/link/delete policies and private documents.
- [ ] Reconcile expiry/cleanup/background work using Supabase scheduling.
- [ ] Import only approved data with ID maps, counts, and rollback procedure.
- [ ] Verify Beem delivery, deployment, secrets, monitoring, backup/restore.
- [ ] Rebuild Flutter and verify all role-based journeys on Android before cutover.

## Verification

Run `npm install --ignore-scripts` and `npm test` from this directory for portable
Edge Function logic tests. These do not substitute for Deno runtime, PostgREST,
Supabase Auth, SQL/RLS, or device integration tests.

Current results: 33 portable tests pass. Strict TypeScript checks pass for handlers,
ledger, and tests (excluding Deno entrypoints). `tests/run-local-sql.ps1` passes
identity, workspace, marketplace, authorization and SMS-ledger checks using minimal Auth schema
stand-ins on the isolated local PostgreSQL database. Its entire transaction,
including fixtures and temporary roles, is rolled back. It refuses pre-existing
Supabase schemas/roles and cannot target a remote database. This is SQL logic
validation, not a full Supabase integration test.

Six new Flutter owner-draft tests cover UUID retry behavior, validation, retained
input/retry and workspace outages. Together with the pending-verification changes,
the expected mobile suite has 27 tests; this is **not** a passing-test claim.
Windows access permissions still prevent a fresh analyzer/test run in this session;
the latest user-verified baseline remains 13 passing tests from before migration.

The installed CLI reports version 2.114.0, but `supabase status` cannot spawn Docker
in this session. Deno installation also fails at the npm subprocess step. The hosted
core is now deployed through the SQL Editor, but the local directory is not durably
CLI-linked because the database password is unavailable. No real SMS has been sent.
Auth gateway rate limiting (including shared Edge egress IPs), CAPTCHA forwarding
and client challenge UI, recovery behavior, and hook deadlines must be validated
before enabling public production registration.

Official references:

- [Supabase Send SMS Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook)
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- [Supabase Edge routing](https://supabase.com/docs/guides/functions/routing)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Beem API responses](https://docs.beem.africa/guides/sms/api-responses)
- [Beem SMS API](https://beem.africa/sms-api/)

## Hosted deployment status (2026-09-11)

Dedicated project `yvcdkmsfuakjflmuatgz` now has the four checked-in migrations
applied: identity, SMS delivery ledger, workspaces, and marketplace. Their versions
are recorded in the protected `supabase_migrations.schema_migrations` table. The
`garilink-api` Edge Function is active, Auth uses the GariLink mobile callback URL,
and database SSL enforcement is enabled.

Validated against the hosted project:

- `GET /health`: HTTP 200.
- `GET /listings?page=1&limit=20`: HTTP 200 with an empty, paginated result.
- Unknown listing detail: sanitized HTTP 404.
- Direct anonymous table selection: denied as designed.
- Portable Supabase tests: 33/33 passed; current Flutter analyzer: no issues;
  current Flutter tests: 27/27 passed.

Do not enable `beem-sms` as an Auth hook until all Beem credentials and the hook
signing secret are stored as project secrets and a controlled Tanzanian-number
delivery test passes. Network restrictions also remain intentionally deferred
until stable CI/operations egress addresses are documented.
