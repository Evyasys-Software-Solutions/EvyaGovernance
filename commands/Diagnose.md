---
description: Run a 20-point health check across the plugin install, project config, PM/notification reachability, docs freshness, board consistency, and git state. Read-only — never changes state. Reports each check as PASS/WARN/FAIL/SKIP with an actionable fix. Target under 15 seconds end-to-end. Use before demos, after a plugin update, or when a command is behaving unexpectedly.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, PowerShell
argument-hint: (no arguments)
skill: evyasys-diagnose
---

You are running **/evyasys:Diagnose**.

## Step 0 — Load workflow

**First — find the plugin's installed workflow directory:**

macOS / Linux — run via **Bash**:
```bash
EVYA_AI=$(find "$HOME/.claude/plugins" -maxdepth 6 -type d -name ".ai" 2>/dev/null | grep -i "EvyaGovernance" | head -1); [ -z "$EVYA_AI" ] && EVYA_AI=".ai"; echo "$EVYA_AI"
```

Windows — run via **PowerShell**:
```powershell
$EVYA_AI = (Get-ChildItem "$env:USERPROFILE\.claude\plugins" -Recurse -Directory -Filter ".ai" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Select-Object -First 1 -ExpandProperty FullName); if (-not $EVYA_AI) { $EVYA_AI = ".ai" }; Write-Output $EVYA_AI
```

Then load these files from `<plugin-ai>/workflows/diagnose/` (fall back to `.ai/workflows/diagnose/` if not found at the plugin path):
1. `AGENT.md` — the diagnostician role
2. `PROMPT.md` — the 20 checks
3. `CHECKLIST.md` — the self-review

Follow `PROMPT.md` exactly. Run every check in parallel where possible. Emit the human-readable report and the structured `<!-- EVYADIAGNOSE ... -->` tail.
