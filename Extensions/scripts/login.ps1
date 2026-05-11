# Capture this user's Azure DevOps PAT and store at $HOME\.evyasys\credentials.
# Run once per machine. Safe to re-run.

$ErrorActionPreference = 'Stop'
$dir = Join-Path $HOME '.evyasys'
$file = Join-Path $dir 'credentials'

Write-Host '[evyasys] Azure DevOps PAT setup' -ForegroundColor Cyan
Write-Host 'Generate one at https://dev.azure.com/<org>/_usersSettings/tokens'
Write-Host 'Scope needed: Work Items (Read & write).'
Write-Host ''

$secure = Read-Host 'Paste your PAT (input hidden)' -AsSecureString
$bstr   = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$pat    = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null

if ([string]::IsNullOrWhiteSpace($pat)) {
    Write-Host '[evyasys] no PAT provided — aborting.' -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

$lines = @()
if (Test-Path $file) {
    $lines = Get-Content $file | Where-Object { $_ -notmatch '^AZURE_PAT=' }
}
$lines += "AZURE_PAT=$pat"
Set-Content -Path $file -Value $lines -Encoding ascii

# Lock down to current user only on Windows.
try {
    icacls $file /inheritance:r /grant:r "$($env:USERNAME):F" *>$null
} catch { }

Write-Host "[evyasys] saved AZURE_PAT to $file" -ForegroundColor Green
