---
description: Decompose a story into developer-ready tasks — 2-3 breakdown strategies, team approval, then 3-8 tasks each ≤ 1 day linked to story ACs.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>  e.g. EVYA-1042
skill: evyasys-create-subtask
---

You are running **/evyasys:CreateSubtask $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/create-subtask/*` (+ `.evyasys/workflows/create-subtask/*` overrides).
2. Read `.evyasys/board/**/<StoryID>/<StoryID>_UserStory.md` in full. List every AC — you must link at least one task to each.
3. Run `python scripts/repo_scan.py --story $ARGUMENTS` — identify affected modules.
4. Ask clarifying questions one at a time per `QUESTIONING.md` (scope, constraints, test strategy). Wait for each answer.
5. Present all 3 decomposition strategies with trade-offs — **A: Backend-first + Frontend in logical groupings** (recommended), **B: Vertical slices**, **C: Layer by layer**. State why A fits this story. Wait for team approval before writing tasks.
6. Write 3–8 tasks using `TASK_TEMPLATE.md`. Each task: ≤ 1 day, linked to ≥ 1 AC, names specific module(s), independently mergeable or order documented, clear acceptance statement.
7. Self-review with `CHECKLIST.md`. Show to user and wait for approval.
8. On approval: save to `.evyasys/board/**/<StoryID>/subtasks/<StoryID>_Subtasks.md` → create ADO child Tasks.

Output: decomposition strategy agreed · task list · file path · ADO Task IDs.
