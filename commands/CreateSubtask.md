---
description: Batch-decompose stories and epics into developer-ready tasks — load shared context once, analyse code across all stories, single consolidated plan approval, then generate 3–7 implementation tasks + mandatory QA task per story with cross-story dependency analysis and a single combined notification.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, PowerShell
argument-hint: <StoryID|EpicID>...  e.g. EVYA-1042 EVYA-1043  or  EP-001
skill: evyasys-create-subtask
---

You are running **/evyasys:CreateSubtask $ARGUMENTS**.

Story or epic IDs are **mandatory**. Before doing anything else, find the plugin's installed workflow directory:

macOS / Linux (Bash): `EVYA_AI=$(find "$HOME/.claude/plugins" -maxdepth 6 -type d -name ".ai" 2>/dev/null | grep -i "EvyaGovernance" | head -1); [ -z "$EVYA_AI" ] && EVYA_AI=".ai"; echo "$EVYA_AI"`

Windows (PowerShell): `$EVYA_AI = (Get-ChildItem "$env:USERPROFILE\.claude\plugins" -Recurse -Directory -Filter ".ai" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Select-Object -First 1 -ExpandProperty FullName); if (-not $EVYA_AI) { $EVYA_AI = ".ai" }; Write-Output $EVYA_AI`

Load and follow `<plugin-ai>/workflows/create-subtask/PROMPT.md` exactly (replace `<plugin-ai>` with the printed path). If the file is not found at the plugin path, fall back to `.ai/workflows/create-subtask/PROMPT.md`. Step 0 handles the input gate, session context check, and confirmation before any analysis begins.
