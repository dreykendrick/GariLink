# GariLink backup and restore runbook

## Policy

Supabase plan-level backup frequency and retention must be verified by a company
administrator before launch; this repository does not prove that hosted backups exist.
Create a manual logical backup before every high-risk migration. Store encrypted dumps
in company-controlled storage, never Git, chat, build artifacts, or developer temp folders.

## Manual pre-release backup

Use a trusted machine with the official Supabase CLI and PostgreSQL client. Obtain the
database password through the company secret manager and link the project interactively.
Prefer Supabase's documented database dump workflow for roles, schema, and data. Record
the source project, UTC time, tool versions, encrypted destination, hash, and operator.
Do not place credentials in shell history or command-line arguments where avoidable.

## Isolated restore drill

1. Create a temporary, access-restricted Supabase project owned by the company.
2. Confirm its project reference differs from production before every restore command.
3. Restore roles/schema/data to that isolated target; never test restoration on production.
4. Run all committed migrations to the current head.
5. Verify row counts and representative relationships without exporting PII.
6. Run identity, workspace, marketplace, media, rental, and seller SQL assertions.
7. Verify RLS is enabled, anonymous private-table access fails, RPC grants are scoped,
   and `vehicle-media` remains private with signed access.
8. Deploy functions with isolated test credentials, smoke-test, then destroy the target
   only after evidence and sign-off are retained according to company policy.

Production migration recovery normally uses an audited forward-fix migration. A database
restore is reserved for an approved incident response because it can discard newer writes.

