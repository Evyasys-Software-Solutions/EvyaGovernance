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

# ── 5. Register plugin ────────────────────────────────────────────────────────
Hr
Say "Registering Evyasys plugin ..."
if (HasCmd 'claude') {
    try {
        claude --plugin marketplace add $InstallDir 2>$null
        claude --plugin install evyasys@EvyaGovernance 2>$null
        Ok "Plugin registered via CLI"
    } catch {
        Warn "Auto-registration failed — register manually (see Step 1 below)."
    }
} else {
    Warn "AI agent CLI not found — register manually (see Step 1 below)."
}

# ── 6. Done ───────────────────────────────────────────────────────────────────
Hr; Ok "Evyasys installed at: $InstallDir"; Hr
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1) If auto-registration failed, open Claude Code and run:" -ForegroundColor White
Write-Host "       /plugin marketplace add $InstallDir" -ForegroundColor Gray
Write-Host "       /plugin install evyasys@EvyaGovernance" -ForegroundColor Gray
Write-Host "     Then fully quit and reopen Claude Code." -ForegroundColor Gray
Write-Host ""
Write-Host "  2) For each project, open Claude Code from within that project folder and run:" -ForegroundColor White
Write-Host "       /evyasys:Setup" -ForegroundColor Gray
Write-Host ""
Write-Host "  3) Commands:" -ForegroundColor White
Write-Host "       /evyasys:TrainDocs                  — scan codebase, generate 20 quality-gate docs" -ForegroundColor Gray
Write-Host "       /evyasys:CreateStory                — draft a user story (handles epics)" -ForegroundColor Gray
Write-Host "       /evyasys:CreateSubtask <StoryID>    — decompose story into developer tasks" -ForegroundColor Gray
Write-Host "       /evyasys:StartDev <StoryID>         — technical brainstorm + kick off development" -ForegroundColor Gray
Write-Host "       /evyasys:ReviewDev <StoryID>        — independent code review" -ForegroundColor Gray
Write-Host "       /evyasys:FinishDev <StoryID>        — AC audit + hand off to QA" -ForegroundColor Gray
Write-Host "       /evyasys:StartQa <StoryID>          — generate comprehensive test plan" -ForegroundColor Gray
Write-Host "       /evyasys:FinishQa <StoryID>         — QA sign-off + release notes" -ForegroundColor Gray
Write-Host "       /evyasys:GenerateReleaseNote <IDs>  — compile branded PDF release notes" -ForegroundColor Gray
Write-Host "       /evyasys:Update                     — update plugin to latest version" -ForegroundColor Gray
Write-Host ""
