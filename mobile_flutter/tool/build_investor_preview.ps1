[CmdletBinding()]
param([switch]$RunFullChecks)
$ErrorActionPreference = 'Stop'
$previewProject = Split-Path -Parent $PSScriptRoot
function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Command failed (exit $LASTEXITCODE). Stop; no successful build claimed." }
}
Push-Location $previewProject
$oldPreviewProperty = $env:ORG_GRADLE_PROJECT_investorPreview
try {
  Write-Host 'INTERNAL LOCAL PREVIEW ONLY. Debug-signed, separate .investor application ID. No production API requests.'
  Invoke-Checked 'flutter' @('--version')
  Invoke-Checked 'flutter' @('pub','get','--enforce-lockfile')
  if ($RunFullChecks) {
    Invoke-Checked 'dart' @('format','--output=none','--set-exit-if-changed','lib','test')
    Invoke-Checked 'flutter' @('analyze','--no-pub')
    Invoke-Checked 'flutter' @('test','--no-pub')
  }
  $env:ORG_GRADLE_PROJECT_investorPreview = 'true'
  Invoke-Checked 'flutter' @('build','apk','--debug','--no-pub','--build-name=1.0.0-investor','--build-number=20261022','--dart-define=INVESTOR_PREVIEW=true','--dart-define=ENABLE_VERIFICATION_PREVIEW=false','--dart-define=ENABLE_IDENTITY_PREPARATION=false','--dart-define=APP_ENV=investor-local-preview','--dart-define=API_BASE_URL=https://preview.example.invalid')
  $previewApk = Join-Path $previewProject 'build/app/outputs/flutter-apk/app-debug.apk'
  if (-not (Test-Path -LiteralPath $previewApk)) { throw 'Flutter returned without an APK.' }
  $previewOutput = Join-Path (Split-Path -Parent $previewProject) ('GariLink-Investor-Preview-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.apk')
  if (Test-Path -LiteralPath $previewOutput) { throw 'Output already exists; refusing overwrite.' }
  Copy-Item -LiteralPath $previewApk -Destination $previewOutput
  Get-Item -LiteralPath $previewOutput | Select-Object FullName,Length
  Get-FileHash -LiteralPath $previewOutput -Algorithm SHA256
  Write-Host 'APK BUILT, DEBUG-SIGNED. Physical installation and journey QA still required.'
} finally {
  $env:ORG_GRADLE_PROJECT_investorPreview = $oldPreviewProperty
  Pop-Location
}
