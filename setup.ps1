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

Ok 'Plugin scaffold validated.'
Write-Host ''
Write-Host '  Next steps:' -ForegroundColor White
Write-Host ''
Write-Host '  1) Register the plugin in Claude Code:' -ForegroundColor White
Write-Host "       /plugin marketplace add $root" -ForegroundColor Gray
Write-Host '       /plugin install evyasys@EvyaGovernance' -ForegroundColor Gray
Write-Host '     Then fully quit and reopen Claude Code.' -ForegroundColor Gray
Write-Host ''
Write-Host '  2) For each project, open Claude Code from within that project folder and run:' -ForegroundColor White
Write-Host '       /evyasys:Setup' -ForegroundColor Gray
Write-Host ''
Write-Host '  3) Commands:' -ForegroundColor White
Write-Host '       /evyasys:TrainDocs                  — scan codebase, generate 20 quality-gate docs' -ForegroundColor Gray
Write-Host '       /evyasys:CreateStory                — draft a user story (handles epics)' -ForegroundColor Gray
Write-Host '       /evyasys:CreateSubtask <StoryID>    — decompose story into developer tasks' -ForegroundColor Gray
Write-Host '       /evyasys:StartDev <StoryID>         — technical brainstorm + kick off development' -ForegroundColor Gray
Write-Host '       /evyasys:ReviewDev <StoryID>        — independent code review' -ForegroundColor Gray
Write-Host '       /evyasys:FinishDev <StoryID>        — AC audit + hand off to QA' -ForegroundColor Gray
Write-Host '       /evyasys:StartQa <StoryID>          — generate comprehensive test plan' -ForegroundColor Gray
Write-Host '       /evyasys:FinishQa <StoryID>         — QA sign-off + release notes' -ForegroundColor Gray
Write-Host '       /evyasys:GenerateReleaseNote <IDs>  — compile branded PDF release notes' -ForegroundColor Gray
Write-Host '       /evyasys:Update                     — update plugin to latest version' -ForegroundColor Gray
Write-Host ''
