---
description: Break a story into developer-ready subtasks — asks clarifying questions one at a time, presents 2–3 decomposition strategies for team approval, then writes 3–8 concrete tasks. Creates ADO child Tasks on approval.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>  e.g. EVYA-1042
skill: evyasys-create-subtask
---

You are running **/EvyaCreateSubtask $ARGUMENTS**.

If `$ARGUMENTS` is empty, stop and ask the user for the StoryID.

1. Load the story (`docs/stories/<StoryID>_UserStory.md`; fall back to ADO fetch if missing).
2. Read `.ai/workflows/create-subtask/*` and any `.evyasys/workflows/create-subtask/*` overrides.
3. Run `python scripts/repo_scan.py --story $ARGUMENTS` for impacted modules.
4. Follow `PROMPT.md` exactly — ask clarifying questions one at a time per `QUESTIONING.md`, then present 2–3 decomposition strategies and wait for team approval before writing tasks.
5. Decompose into 3–8 tasks using `TASK_TEMPLATE.md`. Each task ≤ 1 day, linked to at least one AC.
6. Self-review with `CHECKLIST.md`. Show to user and wait for approval.
7. On approval, hook saves `docs/stories/<StoryID>_Subtasks.md` and creates ADO child Tasks.

Output: decomposition strategy agreed → task list → saved markdown path + ADO Task IDs.
