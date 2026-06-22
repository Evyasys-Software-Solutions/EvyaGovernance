---
description: Wrap development — AC coverage audit (asks clarifying questions for gaps), DoD checklist, diff scope check, Dev Summary. Transitions ADO to Ready for QA.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, PowerShell
argument-hint: <StoryID|EpicID>...  e.g. EVYA-1042  or  EP-001  or  EP-001 EVYA-1005
skill: evyasys-finish-dev
---

You are running **/evyasys:FinishDev $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. **Find the plugin's installed workflow directory**, then load all files under `<plugin-ai>/workflows/finish-dev/` (+ project overrides). If any file is not found at the plugin path, fall back to the same filename under `.ai/workflows/finish-dev/`. Read story, subtasks, brainstorm.

   macOS / Linux (Bash): `EVYA_AI=$(find "$HOME/.claude/plugins" -maxdepth 6 -type d -name ".ai" 2>/dev/null | grep -i "EvyaGovernance" | head -1); [ -z "$EVYA_AI" ] && EVYA_AI=".ai"; echo "$EVYA_AI"`

   Windows (PowerShell): `$EVYA_AI = (Get-ChildItem "$env:USERPROFILE\.claude\plugins" -Recurse -Directory -Filter ".ai" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Select-Object -First 1 -ExpandProperty FullName); if (-not $EVYA_AI) { $EVYA_AI = ".ai" }; Write-Output $EVYA_AI`
2. Run `git diff main...HEAD` and `python scripts/repo_scan.py --story $ARGUMENTS --diff`.
3. For every AC: find the test (file + test name). For any uncovered AC, follow `QUESTIONING.md` — ask one question at a time. Do NOT proceed with any ❌ unresolved.
4. Self-review against `CHECKLIST.md`. Every mandatory item must pass.
5. For any diff anomaly (files outside scope, debug code, missing migrations), ask one question at a time per `QUESTIONING.md`.
6. Produce Dev Summary using `PROMPT.md` structure. Show to user and wait for approval.
7. On approval → save `<StoryID>_DevSummary.md` to story folder → ADO **Ready for QA** → Teams handoff card.

Output: Dev Summary path · ADO state.
