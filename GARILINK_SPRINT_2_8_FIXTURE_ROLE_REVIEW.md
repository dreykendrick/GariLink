# Sprint 2.8 — SQL fixture privilege correction

Local preparation only; no commit, push or CI execution. Branch remains `codex/database-certification`, remote head `477bd8cc8fa7c3ccd5de96d1054462a48c40c182`, PR #1 unmerged.

## Correction

Rental's two controlled `gl_vehicles` setup mutations now RESET ROLE, assert the test administrator (`current_user=session_user`), mutate the scoped fixture, immediately restore authenticated and assert exact renter UUID/session claims. RESET ROLE does not change request JWT settings, so original renter claims remain intact. Rental business RPCs and expected-denial checks still run as authenticated. An added negative write test explicitly verifies authenticated cannot write the protected vehicle table.

Media fixture preparation now explicitly resets role and resolves protected vehicle ID before switching to the owner. Owner/session assertion runs before media operations. The ready-image serializer check now uses authorized `garilink_vehicle` rather than directly reading protected vehicle rows/calling a private helper as the client. Storage INSERT stays authenticated to exercise the existing Storage policy; reserve/finalize/reorder/delete/cross-tenant checks are not elevated.

Pricing's protected fixture ID lookup explicitly uses test administrator, followed by authenticated owner assertion. Private pure pricing-engine and immutable snapshot-trigger checks intentionally remain administrative and are documented; configuration business RPCs and cross-owner denial remain authenticated.

No application migration, grant, RLS, capability rule, Edge function, workflow or Flutter file changed. No expected-denial assertion was removed or relaxed.

## Seven-suite audit

| Suite | Fixture/business boundary finding |
| --- | --- |
| identity | Admin bootstrap/suspension/session setup; authenticated/anonymous denial and service-role-only SMS ledger checks preserved |
| workspace | Admin membership/capability setup, authenticated owner/viewer/suspended-member RPC checks preserved |
| marketplace | Existing RESET boundaries around media, bans, expiry/capability fixtures; public/client/privacy checks preserved |
| rental | Two missing RESET/restoration boundaries corrected; actor/session and direct-write denial added |
| pricing | Explicit admin lookup/reset and owner assertion added; private engine/trigger checks remain admin intentionally |
| media | Protected ID lookup moved to admin preparation; private serializer replaced with owner public RPC; Storage policy exercised as authenticated |
| email-auth | Admin synthetic account/session creation; confirmed-email role, low-risk RPCs and protected mutations/tenant/direct-write denial unchanged |

The eighth seller-management assertion file exists but is not one of the seven files composed by this harness; it was syntax-parsed, not represented as executed.

## Regression

New `audit-fixture-roles.py` uses PostgreSQL ASTs to track role changes across the actual seven-file order. It checks top-level application/Auth DML occurs under admin and Storage DML under authenticated. `fixture-roles.test.mjs` verifies both rental setup mutations and authenticated Storage INSERT. It does not claim to execute DO blocks or replace runtime role/JWT/negative checks.

Local verification:

- Fixture role test: 1 passed, 0 failed, exit 0.
- Full Node suite: 107 passed, 0 failed, 0 skipped, exit 0.
- Existing function-signature regression included; no migration changes.
- Eight assertion files parsed by pglast without outer SQL syntax errors.
- Canonical SQL composition succeeds with all 32 migrations and seven suites.
- Workflow YAML, diff and targeted secret checks: recorded in final preflight.

## Proposed minimal reviewed file set

1. `supabase/tests/rental-assertions.sql`
2. `supabase/tests/media-assertions.sql`
3. `supabase/tests/pricing-assertions.sql`
4. `supabase/tests/audit-fixture-roles.py`
5. `supabase/tests/fixture-roles.test.mjs`
6. `GARILINK_SPRINT_2_8_FIXTURE_ROLE_REVIEW.md`

Unrelated backend/dist, verification UI and previous evidence/reports remain untouched and excluded.

## Certification boundary

The prior run's 32/32 real-platform migrations/replay and platform smoke PASS remain historical evidence. Corrected SQL fixtures have not executed in PostgreSQL yet. Full seven-suite certification remains INCOMPLETE; Auth tokens/recovery/SMTP and real Storage/KYC lifecycle remain separate untested gates. Further errors may surface only after this fixture gate clears.

Request explicit authorization to commit/push only this reviewed test/report set for the next controlled PR workflow. No hosted changes, production deployment, KYC, Windows operations or PR merge permitted. NO-GO for production deployment.
