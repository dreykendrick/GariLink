# Sprint 2.9 — Fourth CI execution and product continuation

## Execution

Authorized six-file commit: `65f312cf62fb7a366b2c056e2d05c5ea07761e1e`.
Run: https://github.com/dreykendrick/GariLink/actions/runs/38272963721.
PR #1 remains unmerged. No extra correction was made/committed/pushed. No hosted Supabase, production Auth/Edge/KYC, Windows or Docker configuration was touched.

## Results

| Job | ID | Conclusion |
| --- | --- | --- |
| postgres-logic | 114891473700 | FAILURE |
| supabase-platform | 114891473039 | SUCCESS |

Both resource cleanup steps succeeded. Decoded logs preserved under `ci-evidence/38272963721/`, with JWT-like/local sb-key values redacted.

- Real platform: all 32 migrations executed during startup AND clean replay (64 applications), including email-first. PostGIS/schema/RLS/grant/RPC-denial smoke and local Auth health passed.
- Stand-in: all 32 migration bodies completed before assertions; enclosing transaction subsequently aborted, so no persisted schema is claimed.
- Identity: PASS (including SMS ledger restrictions).
- Workspace: PASS.
- Marketplace: PASS.
- Rental: started, FAIL at new fixture role/actor assertion.
- Pricing: NOT EXECUTED.
- Media: NOT EXECUTED.
- Email-auth: NOT EXECUTED.
- Node step in CI: SKIPPED after failed SQL step. Local final preflight: 107 passed, 0 failed/skipped, exit 0, including signature/fixture-role tests. YAML, SQL AST/composition, staged diff and targeted secret checks passed.

Three of seven suites completed; four entered, one failed, three not reached. The separate seller-management assertion suite is outside the seven-file runner and remains an explicit unexecuted coverage gap.

## Earliest causal failure

At 2026-10-12 15:49:31.966 UTC:

```text
ERROR: permission denied for schema auth
STATEMENT: select pg_temp.assert_true(current_user='authenticated' and auth.uid()=...
```

`supabase/tests/rental-assertions.sql` now restores the authenticated role correctly after BUSY fixture setup, then calls `auth.uid()` / `auth.jwt()` directly. The minimal stand-in creates the Auth schema but never grants schema USAGE to clients. Previous Auth helper calls ran inside application SECURITY DEFINER functions. This newly introduced direct helper check is incompatible with the stand-in fixture privileges; it is not a failure of the canonical migrations or evidence that application access must be expanded. Insufficient schema privilege corresponds to PostgreSQL 42501; the captured raw log did not explicitly print SQLSTATE.

Smallest recommended correction: check exact `request.jwt.claims` JSON sub/session fields directly using current_setting together with current_user, avoiding a new Auth schema grant. Apply the same change to the new rental/media/pricing actor checks. Keep RPC session/actor checks, direct-write denial and protected business calls unchanged. Do not broadly grant Auth access or weaken RLS. No automatic fix/push is authorized beyond this run.

## Certification verdict

Canonical migration replay: PASS. Real-platform smoke: PASS. Complete SQL/RLS authorization certification: INCOMPLETE. Email-first SQL assertion suite remains unexecuted. Real email delivery, Auth login/refresh/confirmation/recovery/replay, actual Storage lifecycle/private document authorization and KYC are not certified by the health check.

**GO for ordinary non-sensitive local product development. NO-GO for deploying email-first authorization changes or enabling sensitive verification/KYC.** The current blocker is test-fixture validation, not a requirement to stop all Flutter UI work. This is not approval to merge/release or evidence that remaining backend actions are secure.

## Practical next product sprint (plan only)

Run a focused renter/owner journey-completion pass without redesign:

1. Inventory live routes and actions for Home → requirements → Explore → vehicle → request → Trips; verify back navigation, retained form/filter state, loading/error/retry and absent-phone presentation with local tests/test doubles. Do not send requests to hosted services as part of local testing.
2. Audit owner dashboard → workspace → inventory → draft → media → incoming requests. `owner/presentation/pages/menu_page.dart` currently lists disabled Business Profile, Payment & Payouts, Team Management, Subscription and support entries. Classify them honestly: link only existing supported destinations where appropriate; keep payments/subscriptions/fleet policy out of this small sprint. Do not invent working behavior for disabled items.
3. Fix demonstrated non-sensitive navigation, empty/error, accessibility and responsive defects only; preserve premium Home/assets and backend pricing/requestability semantics. Maintain 320/360/390/430/600 and 200% text widget coverage.
4. Run formatter/analyzer/full Flutter and API regression on the final source. Current 192-Flutter result is historical, not a new test run in this CI-execution task.
5. In parallel as a separately authorized certification task, correct the fixture claims checks, complete seven-suite evidence, and add seller-management coverage after reviewing its prerequisites.

## Separate verification-backend plan

Do not equate preview components with KYC implementation. Define scoped server-authoritative decisions, private Storage/RLS/reviewer authorization, expiry/revocation/retention and independently test them before any real document collection. Auth lifecycle and verified HTTPS App Links are separate integration gates. No product changes were made in this task; stop here for the next scoped authorization.
