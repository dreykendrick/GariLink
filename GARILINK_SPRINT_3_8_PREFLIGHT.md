# Sprint 3.8 — pre-certification review and controlled snapshot

2026-10-23. **Certification verdict: NOT EXECUTED. Awaiting explicit commit/push/CI authorization.**

## 1. Exact reviewed snapshot

- Original identity worktree: `GariLink-person-identity`, `codex/person-identity-lifecycle`, unchanged HEAD `bc908897d89d55017d27c16e66e478c5b37e71fe`.
- Prepared separate local worktree: `C:/Users/kibaj/Documents/Codex/2026-09-06/i-x20/work/GariLink-identity-evidence-certification-20261023`.
- Local branch: `codex/identity-evidence-certification-20261023`, same baseline HEAD; **no new commit exists**.
- Exactly **42 files staged**, **3,252 insertions / 1 deletion** against baseline. The single replaced line extends the fixture-role audit suite list; it does not remove an assertion.
- Scope: 1 new workflow, 11 Flutter identity/debug/test files, 4 Edge implementation files, 5 worker files, 4 pending forward migrations, package manifest/lock (2), 14 SQL/test/configuration files, and the source review manifest (1).
- Complete path/hash inventory: `../GariLink-identity-evidence-certification-20261023/GARILINK_SPRINT_3_7C_REVIEW_MANIFEST.json`.
- Review manifest SHA-256: `15b57a651ce38a6468a0cc020e1e1ca943346d4c42ee81c434e9552fe8eba317`.

All 41 original source-file hashes match the earlier manifest. Git normalizes CRLF to LF for eight staged files. The isolated snapshot's manifest now records BOTH original `sha256`/`bytes` and exact staged `gitSha256`/`gitBytes`, with explicit hash semantics. All staged blobs match the latter hashes; there are no semantic staging differences. Original worktree and original manifest were not rewritten.

## 2. Review findings

- Exact staged-path set equals the 41 proposed source paths plus manifest; no extra staged files.
- Relative TypeScript/module imports resolve; pinned `postgres@3.4.7` dependency and lock are present. Flutter dependencies/imports checked through actual analyzer and complete tests, not a raw filesystem approximation of Dart package URI behavior.
- No environment files, generated `backend/dist`, APK/build output, investor adapter or customer-document fixture in the batch.
- Scoped staged credential/private-key pattern scan: zero matches. Runtime credentials are generated/retrieved only inside guarded disposable execution and are not printed. This is not an exhaustive formal secret audit.
- Migration ordering: 34 certified baseline files plus preparation, review lifecycle, transport and sealed infrastructure = **38**. Signature/static composition checks pass. No historical certified migration is edited by this batch.
- Public collection remains false by default; Flutter remains debug-only/product-disabled. No protected booking/publication KYC enforcement added.
- Existing seven SQL suites and closed verification coverage remain intact. New stages append preparation, lifecycle, evidence and infrastructure assertions. Existing 65 real-platform HTTP checks remain unchanged and run before test-only activation.
- Runtime correctness is not inferred from parser/unit success. First real migration replay/custom-role/scanner run can expose defects.

## 3. Workflow and authorization audit

`identity-evidence-certification.yml`: push trigger limited to the new isolated branch, plus workflow_dispatch; read-only `contents`; pinned checkout/setup-node actions; no persisted Git credentials; no repository production secrets, hosted project link, db push, function deployment or PR merge command. PostgreSQL and platform scripts use disposable loopback services. Real identity runner requires GitHub/disposable flags plus exact API/DB loopback configuration before creating any identities or connection. Its module import guard was previously exercised without starting infrastructure.

Postgres job: pinned PostGIS image, empty database, all migrations, original seven plus five verification/identity suites (12 suites total), full Node regression. Supabase job: actual local stack startup and reset, health/schema/closed SQL, 65 closed HTTP checks, real ClamAV fresh signatures/private Unix socket, real evidence runner. `always()` stops disposable Supabase without backup; retained immutable Auth/case histories disappear with that disposable stack. Daemon/remaining filesystem resources are discarded with the ephemeral runner. No individual audit deletion/FK bypass is used.

The new workflow is only a local file. **No workflow run, run URL or job IDs exist.**

## 4. Fresh local preflight results

| Check | Actual result |
| --- | --- |
| Manifest/source hashes | 41/41 match |
| Exact staged Git hashes | 41/41 match canonical Git hashes |
| Staged paths | Exactly 42 |
| `npm test` | 173 passed, 0 failed, 0 skipped, exit 0 |
| `dart format --set-exit-if-changed lib test` | 135 files, 0 changed, exit 0 |
| `flutter analyze --no-pub` | No issues found |
| `flutter test --no-pub --reporter expanded` | 214 passed, 0 failed, final process exit 0 |
| `git diff --cached --check` | Clean |
| Literal secret patterns / missing TypeScript imports | 0 / 0 |

These are local logic/static/widget results, NOT PostgreSQL/Auth/Storage/ClamAV runtime results. No unavailable local database probe was repeated.

## 5. Runtime matrix and coverage limitations

Every runtime row below is **NOT EXECUTED** in Sprint 3.8.

| Gate | Prepared coverage / limitation |
| --- | --- |
| 38 clean migrations | Both jobs; platform startup and reset replay |
| Seven original SQL suites | Logic job preserves all seven |
| Closed + preparation/lifecycle/evidence/infrastructure SQL | Prepared; actual RLS/grants still unproven |
| Real ordinary Auth | Two confirmed disposable password sessions prepared; not a full public registration/confirmation delivery test |
| Real case/reservation/upload | Prepared normal-session path plus wrong-applicant denial; no issued signed upload token in new path |
| Full stored-byte validation and seal | Prepared supported PNG actual Storage -> parser -> ClamAV -> sealed upload -> SQL path |
| Real scanner clean/EICAR | Prepared actual daemon and fresh signature update; no fake fallback |
| Scanner outage/timeout/stale/missing signatures | Some local contract coverage only; real failure scenarios not yet fully in runtime runner |
| Custom-role JWT authentication and sealed privileges | Used by prepared path and SQL ACL assertions; forged-token/overwrite/delete/list full real HTTP matrix still needs expansion |
| Expiry/version/replacement negatives | Local/static and partial SQL fixtures; expiry during processing/replacement needs additional real coverage |
| Reviewer delivery/revocation | Prepared actual read/headers/new-read denial after authority revocation; wrong-case/assignment expiry/revocation during retrieval/digest corruption/range require expanded real cases |
| Concurrency | Prepared parallel HTTP case creation, same-request worker finalization and conflicting decisions; not all race branches covered |
| Transaction timeout/uncertain commit | Adapter implemented; forced infrastructure faults/recovery scenarios not yet prepared/executed |
| Lifecycle expiry/revocation/history | SQL fixtures cover several branches; exhaustive real-session lifecycle remains incomplete |

**Coverage limitation blocks full Sprint 3.8 certification, not a controlled first execution.** A green first run can establish only the scope actually executed. Do not relabel missing scenarios PASS/N/A. Finish the remaining runtime negatives before claiming the full mission complete; adding mock tests does not close these gaps.

## 6. Preservation and production safety

No application/schema implementation changes this pass. Only isolated local Git preparation and manifest hash metadata clarification were made. Original identity uncommitted source remains present; original renter-owner/Home/booking work and investor snapshots were not copied into or written by this task.

Remote PR #1 was read only: OPEN, unmerged, head `bc908897d89d55017d27c16e66e478c5b37e71fe`. Certification branch/worktree contents untouched. No remote branch creation, commit, push, CI dispatch, hosted Supabase access, deployment, real documents or production activation.

## 7. Exact authorization requested

Authorize committing/pushing **only the 42 staged files** in the isolated review manifest onto **`codex/identity-evidence-certification-20261023`**, thereby triggering its isolated workflow. No PR #1 modification or merge, hosted operations or production collection. Reverify staged paths/hashes and remote baseline before writing. Capture exact new commit/run/job IDs and wait for both jobs. On failure, preserve earliest causal logs, classify and prepare only a minimal local correction; obtain separate approval before another push.

## 8. Final readiness

**GO for explicit review/authorization of the first disposable CI execution. NO-GO for production KYC or full security certification.** No final committed SHA or runtime results can be reported before authorization and actual execution.

NOT EXECUTED
