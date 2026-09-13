[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

Write-Host "==> Check Python"
python -c "import sys; print(sys.version)"

$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython)) {
    Write-Host "==> Create .venv"
    python -m venv .venv
}

Write-Host "==> Install maintenance dependencies"
& $venvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    throw "pip upgrade failed with exit code $LASTEXITCODE"
}
& $venvPython -m pip install -r (Join-Path $repoRoot "requirements-dev.txt")
if ($LASTEXITCODE -ne 0) {
    throw "pip install requirements-dev.txt failed with exit code $LASTEXITCODE"
}

Write-Host "==> Canonical Windows gate"
$pwshExe = (Get-Command pwsh -ErrorAction SilentlyContinue)
if ($null -ne $pwshExe) {
    & pwsh -NoProfile -File (Join-Path $repoRoot "tools\dev_check.ps1")
} else {
    & powershell -NoProfile -File (Join-Path $repoRoot "tools\dev_check.ps1")
}

Write-Host ""
Write-Host "維護環境可用。要進行桌面應用產品開發，請執行："
Write-Host "  pnpm install"
Write-Host "  pnpm dev"
Write-Host "詳見 docs\DEVELOPMENT.md"
