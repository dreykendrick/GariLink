# Sprint 2.3 — CI security review and execution readiness

Prepared 2026-10-12. **Ready for first controlled CI execution; SQL/RLS NOT CERTIFIED.** No push, PR or dispatch performed.

## Workflow readiness

YAML parsed locally with PyYAML BaseLoader (avoids YAML 1.1 treating `on` as boolean); job names, read-only permissions and absence of `pull_request_target` checked. Node runners pass syntax checks. Ubuntu 24.04 supports service containers. PostgreSQL 17 aligns with the repository Supabase configuration; PostGIS 3.5 image is now pinned to Docker Registry's observed multi-platform OCI digest `sha256:01a6a70e41e6c4467c8f55f6063555ed72db2d6662cd0d571040d42eadaeb6f6`. Checkout/setup-node use full commit SHAs. Supabase CLI is installed through exact npm version 2.114.0.

The two jobs remain independent. Stand-in job uses disposable port 5433/database `garilink_dev`, creates the database from template0, applies sorted migrations and seven assertion files inside rollback. Platform job starts real local Supabase, repeats the clean local chain on that disposable runner, tests schema/grants/anonymous and missing-session RPC denial/direct-write denial, and checks Auth health using the generated local anon key without printing it. Both are bounded by timeouts (20/30 minutes). `psql ON_ERROR_STOP`, Node child exit propagation and Actions shell defaults propagate failures. Platform cleanup uses `always()`; service containers and runner storage are disposable. No existing developer volume is touched.

Actual PostgreSQL SQL compatibility and workflow orchestration have not been executed. YAML parsing is not a substitute for GitHub's runtime validation or database evidence.

## Security

No `secrets` references, environment approvals, production credentials, project linkage, deployment, provisioning commands or hosted URLs occur in the workflow. Checkout does not persist credentials; contents permission is read-only. Normal PR execution does not receive privileged workflow secrets. Do not add repository/environment secrets or change the event to `pull_request_target`. PR code is still executable untrusted code on a disposable runner, so runner restrictions, first-time-contributor approval and minimal tokens must remain enabled. No caches or uploaded credential artifacts are configured.

The printed migration inventory contains filenames only. Platform health reads local status JSON in memory, validates exact loopback API URL, supplies only its local anon key, and reports status without body/key output. No service-role key is used by the test code. Supabase startup itself can log ephemeral local keys; do not confuse those disposable values with production credentials or upload status JSON.

Version pins do not freeze apt repositories, npm transitive resolution or all Supabase service images. Record resolved platform versions/digests during the first CI run. This is reproducible procedure, not a claim of hermetically frozen infrastructure.

## Coverage

All 32 current timestamp-ordered migrations are dynamically included; pending `20261009000000_email_first_preparation_access.sql` is mandatory. The platform CLI independently applies repository migrations in its normal workflow. No migration/history changes were made.

| Assertion file | Meaningful coverage |
| --- | --- |
| identity | Bootstrap metadata cannot grant admin/capabilities; legacy phone projection; profile validation; account/session revocation; anonymous denial; SMS ledger privilege denial |
| workspace | Owner setup, idempotency, no false verification/admin, cross-workspace reads, viewer write denial, suspended membership denial |
| marketplace | Listing creation/read/publication and direct-access contracts |
| rental | Request/lifecycle authorization and protected rental behavior |
| pricing | Pricing/estimate compatibility and authoritative contract checks |
| media | Authorized upload metadata/cover/delete and media policy checks |
| email-auth | Confirmed email/no phone profile/history/saved reads, workspace/draft creation, publication/rental contact gates, cross-tenant and direct-write denial |

The stand-in fixture is not real Supabase Auth. Platform smoke adds real database grants/RLS/helper existence plus safe RPC rejection; it does not execute the entire seven-file stand-in suite against actual Auth tables. Material gaps: real confirmed-email/legacy sign-in and refresh, actual one-time confirmation/reset/replay, SMTP delivery, full live-platform authorized-owner/unauthorized-member matrix, Storage upload lifecycle and private identity-document security. KYC collection stays disabled. Do not declare those certified because health is green. Additional platform fixtures must use named actual Auth columns, not the stand-in's two-column session inserts.

## Git scope

Local feature branch: `codex/database-certification`, based on `main` commit `f7b1ede`. Files prepared for this CI commit:

- `.github/workflows/database-certification.yml`
- `supabase/tests/run-ci-sql.mjs`
- `supabase/tests/platform-smoke.sql`
- `supabase/tests/platform-health.mjs`
- `GARILINK_SPRINT_2_3_CI_SECURITY_REVIEW.md`

Generated `backend/dist` edits are preserved and excluded. Previous uncommitted verification UI/models/tests and Docker-independent development report are also preserved, excluded from this focused CI commit. No env, signing, database, build or APK files are included.

## Proposed execution procedure — authorization required

From the repository, after approving remote execution:

```powershell
git push -u origin codex/database-certification
```

The workflow is new and absent from default `main`: GitHub requires a default-branch workflow for manual dispatch. Therefore prefer an explicitly authorized controlled PR from this branch into `main`; the `pull_request` path filter will run this workflow, without requiring it to be merged first. Creating the PR triggers CI and consumes Actions usage; approval must cover both push and PR/run, not just a push. GitHub CLI is not installed locally; use authorized GitHub tooling/browser, or install CLI only if separately approved.

If using an already installed/authenticated `gh` elsewhere:

```powershell
gh pr create --repo dreykendrick/GariLink --base main --head codex/database-certification --title "Certify isolated database migrations and authorization" --body "Local CI foundation; no hosted deployment. SQL certification pending first run."
gh run list --repo dreykendrick/GariLink --workflow database-certification.yml --branch codex/database-certification
gh run view <run-id> --repo dreykendrick/GariLink --log-failed
```

Alternatively, once the workflow has been explicitly approved/merged onto default `main`, manual dispatch can select the feature ref:

```powershell
gh workflow run database-certification.yml --repo dreykendrick/GariLink --ref codex/database-certification
```

See [GitHub manual dispatch requirements](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow) and [secure workflow guidance](https://docs.github.com/en/actions/reference/security/secure-use).

Inspect both jobs at the exact run/commit SHA. Download GitHub's run log archive and preserve it with run ID, commit, timestamps and each job conclusion. No custom artifact upload is configured: expected evidence is Actions step logs, migration filename inventory, psql assertions/errors, npm summary and platform smoke/health output. Do not upload raw status credentials or documents. Redact any sensitive values before sharing logs.

For a demonstrated failure: fix only its root cause locally, run local relevant checks, obtain authority for the fix push, then rerun failed/dependent jobs at the new commit. Rerunning an old run does not certify new code. Only issue certification after both jobs definitively succeed and each required security scenario has actual evidence; distinguish untested Auth/Storage lifecycle gates.

Repository Actions must be enabled, pinned actions allowed, and the actor must have write/run permissions. Fork PRs may need maintainer approval. Actions quota/organization restrictions are unverified; no paid resources have been started.

## Final decision

**GO for an explicitly authorized first controlled CI run. NO-GO for hosted deployment.** Workflow prepared and statically validated; no remote execution evidence. Existing local Flutter/API regression remains historical evidence for application behavior, not SQL/RLS certification.
