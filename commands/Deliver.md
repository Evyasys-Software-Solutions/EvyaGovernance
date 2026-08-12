---
description: End-to-end story delivery — reads the story + subtasks, batches clarifying questions, does architecture reference scan, writes the code, runs a full self code-review with auto-fix, drafts tests, queues doc updates, drafts release notes, then (on your approval) commits locally + updates PM state to Ready for QA + notifies. Three approval gates only. Accepts one or more story IDs or an epic ID.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, PowerShell
argument-hint: <StoryID> [StoryID ...] | <EpicID>
skill: evyasys-deliver
---

You are running **/evyasys:Deliver $ARGUMENTS**.

## Step 0 — Load workflow

**First — find the plugin's installed workflow directory** (do this before any file read):

macOS / Linux — run via **Bash**:
```bash
EVYA_AI=$(find "$HOME/.claude/plugins" -maxdepth 6 -type d -name ".ai" 2>/dev/null | grep -i "EvyaGovernance" | head -1); [ -z "$EVYA_AI" ] && EVYA_AI=".ai"; echo "$EVYA_AI"
```

Windows — run via **PowerShell**:
```powershell
$EVYA_AI = (Get-ChildItem "$env:USERPROFILE\.claude\plugins" -Recurse -Directory -Filter ".ai" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Select-Object -First 1 -ExpandProperty FullName); if (-not $EVYA_AI) { $EVYA_AI = ".ai" }; Write-Output $EVYA_AI
```

Use the printed path in place of `.ai` for every workflow file read below.
If a file is not found at the plugin path (older install), fall back to the same path under `.ai/`.

Load these files from `<plugin-ai>/workflows/deliver/`:
1. `AGENT.md` — your role, mandate, and speed contract
2. `PROMPT.md` — the 10-phase workflow with the 3 gates
3. `CHECKLIST.md` — the self-review checklist

Then follow the workflow in `PROMPT.md` exactly. **Do not skip Phase 0 batch load** —
it is the reason the whole run stays fast.
