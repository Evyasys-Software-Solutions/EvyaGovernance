---
description: Configure Evyasys for this project — choose PM tool (Local / Azure DevOps / JIRA / GitHub Projects) and notification channel (None / Teams / Slack / WhatsApp / Email), then collect and validate credentials. Safe to re-run to update config or rotate secrets.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, PowerShell
skill: evyasys-setup
---

You are running **/evyasys:Setup**.

## Step 0 — Load the workflow  ⛔ HARD GATE

**First — find the plugin's installed workflow directory** (do this before any file read):

macOS / Linux — run via **Bash**:
```bash
EVYA_AI=$(find "$HOME/.claude/plugins" -maxdepth 6 -type d -name ".ai" 2>/dev/null | grep -i "EvyaGovernance" | head -1); [ -z "$EVYA_AI" ] && EVYA_AI=".ai"; echo "$EVYA_AI"
```
Windows — run via **PowerShell**:
```powershell
$EVYA_AI = (Get-ChildItem "$env:USERPROFILE\.claude\plugins" -Recurse -Directory -Filter ".ai" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Select-Object -First 1 -ExpandProperty FullName); if (-not $EVYA_AI) { $EVYA_AI = ".ai" }; Write-Output $EVYA_AI
```

Use the printed path in place of `.ai` for every workflow file read below. If a file is not found at the plugin path (older install), fall back to the same path under `.ai/`. Then read both files:

1. `<plugin-ai>/workflows/setup/AGENT.md` — your agent role and rules
2. `<plugin-ai>/workflows/setup/PROMPT.md` — the full step-by-step wizard

**Do not ask any questions, do not read project files, and do not take any action until you have loaded both files.**

---

Once you have read both files, follow the PROMPT.md wizard exactly — one question at a time — and at the end output the `<!-- EVYACONFIG { ... } -->` block exactly as the PROMPT.md instructs.
