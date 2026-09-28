[CmdletBinding()]
param(
  [ValidateSet('debug', 'release')]
  [string]$Mode = 'debug',
  [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
  $configuredGradleHome = $env:GRADLE_USER_HOME
  if ([string]::IsNullOrWhiteSpace($configuredGradleHome) -or
      -not (Test-Path -LiteralPath $configuredGradleHome)) {
    $env:GRADLE_USER_HOME = Join-Path $projectRoot '.gradle-cache'
  }
  New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null

  flutter pub get
  flutter analyze --no-pub
  if (-not $SkipTests) { flutter test --no-pub }
  flutter build apk "--$Mode" --no-pub
} finally {
  Pop-Location
}
