---
description: Wrap development — AC coverage audit (asks clarifying questions for gaps), DoD checklist, diff scope check, Dev Summary. Transitions ADO to Ready for QA.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-finish-dev
---

You are running **/evyasys:FinishDev $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/finish-dev/*` (+ project overrides). Read story, subtasks, brainstorm.
2. Run `git diff main...HEAD` and `python scripts/repo_scan.py --story $ARGUMENTS --diff`.
3. For every AC: find the test (file + test name). For any uncovered AC, follow `QUESTIONING.md` — ask one question at a time. Do NOT proceed with any ❌ unresolved.
4. Self-review against `CHECKLIST.md`. Every mandatory item must pass.
5. For any diff anomaly (files outside scope, debug code, missing migrations), ask one question at a time per `QUESTIONING.md`.
6. Produce Dev Summary using `PROMPT.md` structure. Show to user and wait for approval.
7. On approval → save `<StoryID>_DevSummary.md` to story folder → ADO **Ready for QA** → Teams handoff card.

Output: Dev Summary path · ADO state.
