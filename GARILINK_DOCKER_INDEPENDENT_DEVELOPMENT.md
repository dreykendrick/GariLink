# Docker-independent development and CI certification

Prepared locally 2026-10-12. No push, workflow dispatch, hosted access or deployment authorized/performed.

## Repository inspection

Branch `main` is based on the existing GitHub history. Existing dirty files are generated `backend/dist` output; preserved untouched. No Actions workflows existed. There are 32 canonical SQL migrations, including `20261009000000_email_first_preparation_access.sql`. The existing Windows rollback harness is fixed to port 5433/database `garilink_dev` and supplies minimal Auth/Storage stand-ins. The CLI config targets PostgreSQL 17 on 54322 with API on 54321. Native PostgreSQL and Windows/Docker recovery are deliberately out of scope.

## CI architecture and files

`.github/workflows/database-certification.yml` has read-only repository permissions, SHA-pinned checkout/setup-node actions, Node 22.20.0 and Supabase CLI 2.114.0. No production credentials or project references are used. Pull requests touching relevant files and manual dispatch can execute it after an authorized push. Jobs have bounded timeouts and run on disposable Ubuntu 24.04 runners.

1. **postgres-logic:** PostGIS image `17-3.5`, separate empty `garilink_dev` database on 5433, complete sorted migration chain and all seven existing assertion files within one rollback. Empty database creation avoids the image's preinstalled public PostGIS interfering with the repository's extension schema. `supabase/tests/run-ci-sql.mjs` refuses execution outside an explicitly identified CI job and hardcodes loopback/test database. `--print` safely generates the composed SQL without connecting anywhere. Service resources disappear with the runner. The image tag pins a compatibility line, not immutable image bytes; record/pin a reviewed digest before treating tooling as byte-reproducible certification.
2. **supabase-platform:** starts real local Supabase on the disposable Linux runner, repeats migrations using explicitly `db reset --local --no-seed`, executes `platform-smoke.sql`, checks actual local Auth health and always stops runner-only resources. It cannot use a linked hosted project. The cleanup command is confined to this ephemeral job, not a developer machine. This job provides real schema/RLS/private-helper and Auth-health evidence, NOT full Auth registration/recovery/Storage lifecycle coverage. Those additional integrations remain required.

Supported basis: [Supabase CI testing](https://supabase.com/docs/guides/deployment/ci/testing), [Supabase local workflow](https://supabase.com/docs/guides/local-development/cli-workflows), [PostGIS image source](https://github.com/postgis/docker-postgis).

## Local development without Docker

Continue using `npm ci`/`npm test` in `supabase`, and `flutter pub get`, formatter, analyzer and widget/unit tests in `mobile_flutter`. These do not require Docker. Do not invoke hosted provisioning scripts as a substitute for local SQL tests. No application behavior was changed to work around infrastructure. The Windows SQL runner is preserved, not redirected to another database.

## Progressive verification foundation

New presentation-only models and reusable checklist live under `mobile_flutter/lib/features/verification/`. Status distinguishes not-started, pending, rejected, expired and approved. A preview flag is disabled by default and forced off in release. No production route references the component. All supplied states must be treated as untrusted presentation values, never approval or authorization.

Draft requirement scopes distinguish with-driver renter identity/contact from designated-driver licence requirements in self-drive. Owner/driver scopes list document categories without asserting legal acceptance rules. New widget tests cover pending-not-approved presentation, narrow 200% text, no collection action, disabled preview and mode distinction. No file picker, document upload, reviewer approval, Storage path, persistence or backend bypass exists. Profile/publication/booking remain unchanged. Actual driver submission and resumed-action journeys are deferred until secure backend contracts exist.

## Security and outstanding certification

Do not collect real identity documents. Before enablement, independently certify private Storage/RLS, review authorization, retention, expiry/revocation and server-authoritative action gates. Existing publication/rental controls remain unchanged. Custom-scheme callback interception and verified HTTPS App Links remain outstanding, as documented in the Sprint 2.1 report; no domain/signing fingerprint is assumed.

GitHub Actions has **NOT RUN** in this task. Migration and SQL/RLS outcomes remain **NOT CERTIFIED** until logs show actual execution. A prepared workflow is not PASS evidence and may reveal canonical-chain defects. Fix demonstrated defects only after the first run; never mark migrations applied or weaken assertions to conceal failure.

## Verification record

- Node API regression: 103 passed, 0 failed, 0 skipped; exit 0.
- SQL generator: syntax check and dry composition succeeded; 32 migrations plus seven assertions composed. No database execution.
- Full Flutter regression: 192 passed, 0 failed; definitive exit 0 (1m24s reported test runtime).
- New focused verification tests: 3 passed, 0 failed; exit 0.
- Formatter verification: 129 files, 0 changes; exit 0.
- Initial analyzer found two relative-lib-import lint findings in the new test; corrected to package imports. Final `flutter analyze --no-pub`: no issues, exit 0.
- SQL runner safety: normal local execution is deliberately rejected before any connection; composition/syntax checks succeeded. This is guard evidence, not SQL execution.
- Tooling: Flutter 3.41.7 / Dart 3.11.5 available. Doctor reports SDK unknown Git/channel configuration and unaccepted Android licences. Android SDK/Java are installed; no build requested, no licences accepted or SDK settings changed.
- No remote push, paid resources, production credentials, hosted Auth changes, Edge deployment, KYC collection or release artifacts.

## Recommended next sprint

Obtain approval to push these CI files and run GitHub Actions. Review both job logs, certify/fix the SQL access matrix, then add real isolated Auth token/recovery and Storage lifecycle integration tests. Only after backend review/storage security is proven should progressive verification gain document submission and server-driven resume flows.
