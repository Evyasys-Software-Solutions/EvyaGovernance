# Evyasys — one-command team install (Windows PowerShell).
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1 [-InstallDir "C:\Tools\evyasys"]
param(
    [string]$InstallDir = "$env:USERPROFILE\tools\evyasys"
)
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Say($m)  { Write-Host "[evyasys] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[evyasys] WARN  $m" -ForegroundColor Yellow }
function Ok($m)   { Write-Host "[evyasys] OK    $m" -ForegroundColor Green }
function Err($m)  { Write-Host "[evyasys] ERROR $m" -ForegroundColor Red }
function Hr()     { Write-Host ("─" * 50) -ForegroundColor DarkGray }
function HasCmd($n) { $null -ne (Get-Command $n -ErrorAction SilentlyContinue) }

Hr; Say "Evyasys Installer"; Hr

# ── 1. Copy plugin ────────────────────────────────────────────────────────────
if ($ScriptDir -ne $InstallDir) {
    Say "Copying plugin to $InstallDir ..."
    if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
    Copy-Item -Recurse -Force "$ScriptDir\*" "$InstallDir\"
    Ok "Plugin copied to $InstallDir"
} else {
    Ok "Running from install location: $InstallDir"
}
Set-Location $InstallDir

# ── 2. Tooling checks ─────────────────────────────────────────────────────────
Say "Checking required tools ..."
$MissingTools = 0

if (HasCmd 'node') {
    $v = (node --version); Ok "Node.js $v"
} else {
    Err "Node.js not found — install from https://nodejs.org/"
    $MissingTools = 1
}

$pyCmd = if (HasCmd 'python3') { 'python3' } elseif (HasCmd 'python') { 'python' } else { $null }
if ($pyCmd) {
    $v = (& $pyCmd --version 2>&1); Ok "$v"
    try {
        & $pyCmd -c "import requests" 2>$null
        if ($LASTEXITCODE -eq 0) { Ok "Python 'requests' available" }
        else { Warn "Python 'requests' missing — run: $pyCmd -m pip install requests --user" }
    } catch { Warn "Could not verify requests module." }
} else {
    Err "Python not found — install from https://www.python.org/"
    $MissingTools = 1
}

if (HasCmd 'git') { Ok "git $(git --version)" } else { Err "git not found"; $MissingTools = 1 }

# ── 3. npm install ────────────────────────────────────────────────────────────
if ((HasCmd 'npm') -and (Test-Path "$InstallDir\package.json")) {
    Say "Installing Node dependencies ..."
    npm install --prefix "$InstallDir" --silent
    Ok "npm install done"
}

# ── 4. Validate plugin files ──────────────────────────────────────────────────
Say "Validating plugin files ..."
$allOk = $true
$required = @(
    '.claude-plugin\plugin.json',
    'commands\command.json',
    'hooks\evyasys-load-context.js',
    '.ai\manifest.yaml',
    '.ai\memory\evyaflow.json',
    '.ai\workflows\create-story\PROMPT.md',
    '.ai\workflows\create-subtask\PROMPT.md',
    '.ai\workflows\start-dev\PROMPT.md',
    '.ai\workflows\start-dev\BRAINSTORM_TEMPLATE.md',
    '.ai\workflows\finish-dev\PROMPT.md',
    '.ai\workflows\start-qa\PROMPT.md',
    '.ai\workflows\finish-qa\PROMPT.md',
    'scripts\integrations\azure_devops.js',
    'scripts\integrations\teams_webhook.js',
    'project-template\.evyasys\project.yaml.example'
)
foreach ($f in $required) {
    if (Test-Path $f) { Ok $f } else { Err "Missing: $f"; $allOk = $false }
}
if (-not $allOk) { Warn "Some files are missing — the plugin may not work correctly." }

# ── 5. Register plugin (before asking for credentials) ───────────────────────
Hr
Say "Registering Evyasys plugin ..."
if (HasCmd 'claude') {
    try {
        claude --plugin marketplace add $InstallDir 2>$null
        claude --plugin install evyasys 2>$null
        Ok "Plugin registered via CLI"
    } catch {
        Warn "Auto-registration failed — register manually (see Step 1 below)."
    }
} else {
    Warn "AI agent CLI not found — register manually (see Step 1 below)."
}

# ── 6. Azure DevOps PAT ───────────────────────────────────────────────────────
Hr
Say "Azure DevOps Personal Access Token"
$credFile = Join-Path $env:USERPROFILE '.evyasys\credentials'
$credDir  = Split-Path $credFile

function SaveCred($key, $value) {
    if (-not (Test-Path $credDir)) { New-Item -ItemType Directory -Path $credDir -Force | Out-Null }
    $lines = @()
    if (Test-Path $credFile) {
        $lines = Get-Content $credFile | Where-Object { $_ -notmatch "^$key=" }
    }
    $lines += "$key=$value"
    $lines | Set-Content -Path $credFile -Encoding UTF8
}

if ((Test-Path $credFile) -and ((Get-Content $credFile -Raw) -match 'AZURE_PAT=')) {
    Ok "PAT already saved at $credFile"
} else {
    Say "The PAT lets Evyasys create and update work items in Azure DevOps."
    Say "Generate at: https://dev.azure.com/<your-org>/_usersSettings/tokens"
    Say "Scope: Work Items (Read and write)"
    Write-Host ""
    $pat = Read-Host "  Paste your PAT (or press Enter to skip)"
    if ($pat) {
        SaveCred 'AZURE_PAT' $pat
        Ok "PAT saved to $credFile"
    } else {
        Warn "Skipped — run 'scripts\login.ps1' before using live commands."
    }
}

# ── 7. Microsoft Teams webhook ───────────────────────────────────────────────
Hr
Say "Microsoft Teams Webhook (optional default)"
if ((Test-Path $credFile) -and ((Get-Content $credFile -Raw) -match 'TEAMS_WEBHOOK=')) {
    Ok "Teams webhook already saved in $credFile"
} else {
    Say "Evyasys can post cards to Teams when stories are created or status changes."
    Say "To get a webhook: Teams channel → Connectors → Incoming Webhook → copy URL."
    Say "(You can also set this per-project in .evyasys/project.yaml — press Enter to skip.)"
    Write-Host ""
    $webhook = Read-Host "  Paste your Teams webhook URL (or press Enter to skip)"
    if ($webhook) {
        SaveCred 'TEAMS_WEBHOOK' $webhook
        Ok "Teams webhook saved to $credFile"
    } else {
        Warn "Skipped — Evyasys will prompt for the webhook the first time a command needs it."
    }
}

# ── 8. Done ───────────────────────────────────────────────────────────────────
Hr; Ok "Evyasys installed at: $InstallDir"; Hr
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1) If auto-registration failed, open your AI agent and run:" -ForegroundColor White
Write-Host "       /plugin marketplace add $InstallDir" -ForegroundColor Gray
Write-Host "       /plugin install evyasys" -ForegroundColor Gray
Write-Host ""
Write-Host "  2) For each project, drop the config folder:" -ForegroundColor White
Write-Host "       Copy-Item -Recurse $InstallDir\project-template\.evyasys <project>\.evyasys" -ForegroundColor Gray
Write-Host "       # Edit .evyasys\project.yaml — fill in name, ADO org/project, then git commit" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3) Commands:" -ForegroundColor White
Write-Host "       /EvyaCreateStory            — draft a story (asks save folder, handles epics)" -ForegroundColor Gray
Write-Host "       /EvyaCreateSubtask EVYA-id  — decompose into dev tasks" -ForegroundColor Gray
Write-Host "       /EvyaStartDev EVYA-id       — brainstorm + kick off dev" -ForegroundColor Gray
Write-Host "       /EvyaFinishDev EVYA-id      — AC audit + hand off to QA" -ForegroundColor Gray
Write-Host "       /EvyaStartQa EVYA-id        — generate test plan" -ForegroundColor Gray
Write-Host "       /EvyaFinishQa EVYA-id       — release sign-off + notes" -ForegroundColor Gray
Write-Host ""
Write-Host "  Dry-run (preview — no ADO/Teams changes):" -ForegroundColor DarkGray
Write-Host "       `$env:EVYASYS_DRY_RUN = '1'; /EvyaCreateStory" -ForegroundColor DarkGray
Write-Host ""
