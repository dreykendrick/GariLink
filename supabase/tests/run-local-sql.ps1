$ErrorActionPreference = 'Stop'
# Deliberately fixed to this project's isolated local development database.
# No .env parsing, arbitrary connection URL, production target, or persistent write.
$testPsql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$fixture = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'identity-fixture.sql')
$migrationFiles = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '../migrations') -Filter '*.sql' | Sort-Object Name
$migration = ($migrationFiles | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName }) -join "`n"
$assertions = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'identity-assertions.sql')
$workspaceAssertions = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'workspace-assertions.sql')
$marketplaceAssertions = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'marketplace-assertions.sql')
$rentalAssertions = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'rental-assertions.sql')
$pricingAssertions = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'pricing-assertions.sql')
$mediaAssertions = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'media-assertions.sql')
# Supabase migrations have their own transaction. Combine them into one rollback
# transaction for this stand-in SQL test, including temporary database roles.
$migration = $migration -replace '(?im)^begin;\s*$', '' -replace '(?im)^commit;\s*$', ''
$testSql = "BEGIN;`n$fixture`n$migration`n$assertions`n$workspaceAssertions`n$marketplaceAssertions`n$rentalAssertions`n$pricingAssertions`n$mediaAssertions`nROLLBACK;"
$testSql | & $testPsql -h 127.0.0.1 -p 5433 -U garilink -d garilink_dev -X -v ON_ERROR_STOP=1 -q
if ($LASTEXITCODE -ne 0) { throw 'Supabase identity SQL checks failed; transaction was rolled back.' }
