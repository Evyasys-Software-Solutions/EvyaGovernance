---
description: Wrap development — reads diff and all story artefacts, asks clarifying questions one at a time for any uncovered AC or scope anomaly, runs AC coverage audit + CHECKLIST gate, produces Dev Summary, transitions ADO to Ready for QA.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-finish-dev
---

You are running **/EvyaFinishDev $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/finish-dev/*` (+ any `.evyasys/workflows/finish-dev/*` overrides).
2. Read the story, subtasks, and tech brainstorm (if available) in full.
3. Run `git diff main...HEAD` and `python scripts/repo_scan.py --story $ARGUMENTS --diff`.
4. For every AC, find the specific test that proves it passes. For any uncovered AC, follow `QUESTIONING.md` — ask one question at a time to resolve it. Do NOT proceed with any ❌ unresolved.
5. Self-review against `CHECKLIST.md`. Every mandatory item must pass.
6. For any diff anomaly (files outside scope, debug code, missing migrations), ask one question at a time per `QUESTIONING.md` before resolving.
7. Produce the Dev Summary using the `PROMPT.md` structure. Show to user and wait for approval.
8. On approval, transition ADO state to **Ready for QA** and post the Teams handoff card.

Output: Dev Summary path + new ADO state.
