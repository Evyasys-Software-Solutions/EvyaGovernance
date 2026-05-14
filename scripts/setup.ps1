# Evyasys machine-level setup.
# Asks for PAT, validates it, then collects ADO org, project, and optional Teams webhook.
# Run once per machine. Safe to re-run — only supplied keys are overwritten.
#
# Usage (interactive — prompts for every missing value):
#   powershell -ExecutionPolicy Bypass -File setup.ps1
#
# Usage (non-interactive — pass any combination of params):
#   setup.ps1 -Pat "xxx" -Org "contoso" -Project "MyApp"
#   setup.ps1 -Pat "xxx" -Org "contoso" -Project "MyApp" -TeamsWebhook "https://..."

param(
    [string]$Pat          = '',
    [string]$Org          = '',
    [string]$Project      = '',
    [string]$TeamsWebhook = ''
)

$ErrorActionPreference = 'Stop'
$dir  = Join-Path $HOME '.evyasys'
$file = Join-Path $dir 'credentials'

Write-Host '[evyasys] Machine setup' -ForegroundColor Cyan
Write-Host ''

# ── Step 1: Azure DevOps PAT ──────────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($Pat)) {
    Write-Host 'Step 1 — Azure DevOps Personal Access Token'
    Write-Host 'Generate one at: https://dev.azure.com/<org>/_usersSettings/tokens'
    Write-Host 'Scope needed: Work Items (Read & write).'
    $secure = Read-Host 'Paste your PAT (input hidden)' -AsSecureString
    $bstr   = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $Pat    = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null
}

if ([string]::IsNullOrWhiteSpace($Pat)) {
    Write-Host '[evyasys] No PAT provided — aborting.' -ForegroundColor Red
    exit 1
}

# Validate PAT against the Azure DevOps profile endpoint (no org needed).
Write-Host ''
Write-Host 'Validating PAT...' -NoNewline
try {
    $base64  = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$Pat"))
    $headers = @{ Authorization = "Basic $base64" }
    $resp    = Invoke-WebRequest `
                   -Uri 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1' `
                   -Headers $headers `
                   -UseBasicParsing `
                   -ErrorAction Stop
    $profile = $resp.Content | ConvertFrom-Json
    $name    = if ($profile.displayName) { $profile.displayName } else { 'verified' }
    Write-Host " confirmed ($name)" -ForegroundColor Green
} catch {
    Write-Host ' failed.' -ForegroundColor Red
    Write-Host '[evyasys] PAT is invalid or expired — aborting.' -ForegroundColor Red
    exit 1
}

# ── Step 2: Azure DevOps Organisation ────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($Org)) {
    Write-Host ''
    Write-Host 'Step 2 — Azure DevOps Organisation'
    $Org = Read-Host 'Organisation name (e.g. contoso)'
}

if ([string]::IsNullOrWhiteSpace($Org)) {
    Write-Host '[evyasys] No ADO organisation provided — aborting.' -ForegroundColor Red
    exit 1
}

# ── Step 3: Azure DevOps Project ─────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($Project)) {
    Write-Host ''
    Write-Host 'Step 3 — Azure DevOps Project'
    $Project = Read-Host 'Project name (e.g. MyApp)'
}

if ([string]::IsNullOrWhiteSpace($Project)) {
    Write-Host '[evyasys] No ADO project provided — aborting.' -ForegroundColor Red
    exit 1
}

# ── Optional: Teams webhook ───────────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($TeamsWebhook)) {
    Write-Host ''
    Write-Host 'Teams webhook URL (optional — press Enter to skip).'
    Write-Host 'Get it from: Teams channel → ... → Connectors → Incoming Webhook → copy URL.'
    $TeamsWebhook = Read-Host 'Teams webhook URL'
}

# ── Save to credentials ───────────────────────────────────────────────────────
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

$updates = [ordered]@{
    AZURE_PAT     = $Pat
    AZURE_ORG     = $Org
    AZURE_PROJECT = $Project
}
if (-not [string]::IsNullOrWhiteSpace($TeamsWebhook)) {
    $updates['TEAMS_WEBHOOK'] = $TeamsWebhook
}

$lines = @()
if (Test-Path $file) {
    $keysToReplace = $updates.Keys
    $lines = Get-Content $file | Where-Object {
        $key = ($_ -split '=', 2)[0].Trim()
        $keysToReplace -notcontains $key
    }
}
foreach ($kv in $updates.GetEnumerator()) {
    $lines += "$($kv.Key)=$($kv.Value)"
}
Set-Content -Path $file -Value $lines -Encoding ascii

# Lock down to current user only.
try {
    icacls $file /inheritance:r /grant:r "$($env:USERNAME):F" *>$null
} catch { }

Write-Host ''
Write-Host "[evyasys] Saved to $file" -ForegroundColor Green
Write-Host "  AZURE_PAT     = (hidden)"
Write-Host "  AZURE_ORG     = $Org"
Write-Host "  AZURE_PROJECT = $Project"
if (-not [string]::IsNullOrWhiteSpace($TeamsWebhook)) {
    Write-Host "  TEAMS_WEBHOOK = $TeamsWebhook"
}
