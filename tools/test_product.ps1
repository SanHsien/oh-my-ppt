[CmdletBinding()]
param(
    [switch]$TypecheckOnly,
    [string]$TestFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$nodeModules = Join-Path $repoRoot "node_modules"
if (-not (Test-Path -LiteralPath $nodeModules)) {
    Write-Host "==> node_modules not found. Running pnpm install..."
    & pnpm install
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm install failed with exit code $LASTEXITCODE"
    }
}

if ($TypecheckOnly) {
    Write-Host "==> Run TypeScript typecheck"
    & pnpm typecheck
    if ($LASTEXITCODE -ne 0) {
        throw "Typecheck failed with exit code $LASTEXITCODE"
    }
    Write-Host "PRODUCT TYPECHECK GREEN"
    return
}

if ($TestFile) {
    Write-Host "==> Run Vitest for $TestFile"
    & pnpm test -- $TestFile
} else {
    Write-Host "==> Run Vitest full test suite"
    & pnpm test
}

if ($LASTEXITCODE -ne 0) {
    throw "Product tests failed with exit code $LASTEXITCODE"
}

Write-Host "PRODUCT TESTS GREEN"
