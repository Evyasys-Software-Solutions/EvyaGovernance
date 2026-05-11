# Evyasys plugin setup (Windows PowerShell).
# Run once on each developer's machine right after cloning this folder.
#   powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Say($m)  { Write-Host "[evyasys] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[evyasys] $m" -ForegroundColor Yellow }
function Ok($m)   { Write-Host "[evyasys] $m" -ForegroundColor Green }

Say "Setting up Evyasys plugin in $root"

function HasCmd($name) { $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }
if (-not (HasCmd 'node'))   { Warn 'node not found — JS hooks/integrations will not run.' }
if (-not (HasCmd 'python')) { Warn 'python not found — Python helpers will not run.' }

if (HasCmd 'python') {
    try {
        python -c "import requests" 2>$null
        if ($LASTEXITCODE -eq 0) { Ok "Python 'requests' is available." }
        else { Warn "Python 'requests' missing. Run: python -m pip install requests --user" }
    } catch { Warn 'Could not test requests import.' }
}

$required = @(
    '.claude-plugin/plugin.json',
    'commands/command.json',
    'hooks/evyasys-load-context.js',
    '.ai/manifest.yaml',
    '.ai/memory/evyaflow.json',
    '.ai/workflows/create-story/PROMPT.md',
    '.ai/workflows/create-subtask/PROMPT.md',
    '.ai/workflows/start-dev/PROMPT.md',
    '.ai/workflows/finish-dev/PROMPT.md',
    '.ai/workflows/start-qa/PROMPT.md',
    '.ai/workflows/finish-qa/PROMPT.md',
    'scripts/login.ps1',
    'project-template/.evyasys/project.yaml.example'
)
foreach ($f in $required) {
    if (-not (Test-Path $f)) { Warn "Missing $f" }
    else { Ok "OK: $f" }
}

$cred = Join-Path $HOME '.evyasys\credentials'
if (Test-Path $cred) {
    if ((Get-Content $cred) -match '^AZURE_PAT=') { Ok "PAT already saved at $cred" }
    else { Say "PAT not yet saved. Run: powershell -ExecutionPolicy Bypass -File $root\scripts\login.ps1" }
} else {
    Say "PAT not yet saved. Run: powershell -ExecutionPolicy Bypass -File $root\scripts\login.ps1"
}

Ok 'Plugin scaffold validated.'
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor White
Write-Host ''
Write-Host '  1) Register the plugin in your AI agent:' -ForegroundColor White
Write-Host "       /plugin marketplace add $root" -ForegroundColor White
Write-Host '       /plugin install evyasys' -ForegroundColor White
Write-Host ''
Write-Host '  2) Save your PAT once per machine:' -ForegroundColor White
Write-Host "       powershell -ExecutionPolicy Bypass -File $root\scripts\login.ps1" -ForegroundColor White
Write-Host ''
Write-Host '  3) For each project, drop a .evyasys/ folder:' -ForegroundColor White
Write-Host "       Copy-Item -Recurse $root\project-template\.evyasys <your-project>\.evyasys" -ForegroundColor White
Write-Host '       # Edit <your-project>\.evyasys\project.yaml, then git commit it.' -ForegroundColor White
Write-Host ''
Write-Host '  4) From inside that project, run any command:' -ForegroundColor White
Write-Host '       /EvyaCreateStory            — draft a user story' -ForegroundColor White
Write-Host '       /EvyaCreateSubtask EVYA-id  — decompose into dev tasks' -ForegroundColor White
Write-Host '       /EvyaStartDev EVYA-id       — kick off development' -ForegroundColor White
Write-Host '       /EvyaFinishDev EVYA-id      — hand off to QA' -ForegroundColor White
Write-Host '       /EvyaStartQa EVYA-id        — generate test plan' -ForegroundColor White
Write-Host '       /EvyaFinishQa EVYA-id       — release sign-off + notes' -ForegroundColor White
Write-Host ''
Write-Host '  TIP: set $env:EVYASYS_DRY_RUN=1 to preview without touching ADO or Teams.' -ForegroundColor DarkGray
