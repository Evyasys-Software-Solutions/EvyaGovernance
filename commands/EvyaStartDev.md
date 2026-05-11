---
description: Kick off development — structured technical brainstorm (3+ approaches, recommendation, team approval) followed by branch/PR/DoR/dependency gates. Transitions ADO to In Progress on GO.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-start-dev
---

You are running **/EvyaStartDev $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

## Phase 1 — Technical Brainstorm

1. Load `.ai/workflows/start-dev/AGENT.md` and `.ai/workflows/start-dev/PROMPT.md`
   (+ any `.evyasys/workflows/start-dev/*` overrides).
2. Read the story (`docs/stories/<id>_UserStory.md`) and subtasks in full.
3. Run `python scripts/repo_scan.py --story $ARGUMENTS` — list affected modules and risk areas.
4. Generate **at least 3 meaningfully distinct** implementation approaches using `PROMPT.md` Step 3 format.
   Each approach must have specific pros, specific cons, and an estimate delta.
5. State a recommendation with the deciding reason and top risk.
6. List open questions.
7. Present using `BRAINSTORM_TEMPLATE.md`. Ask: "Do you agree with the recommended approach?"
8. **Wait for team response.** Accept any chosen option. Do not proceed to gates until agreed.

## Phase 2 — Start-Dev Gates (run only after brainstorm is agreed)

9. Gate 1 — Subtasks: confirm `docs/stories/<id>_Subtasks.md` exists and is non-empty.
10. Gate 2 — Branch: `git branch --list 'feature/<id>-*'` — must match naming rules.
11. Gate 3 — Draft PR: `gh pr list --head "feature/<id>-" --state open` (best-effort; ask user if gh unavailable).
12. Gate 4 — Definition of Ready: re-run `definition-of-ready.md` line by line.
13. Gate 5 — Dependencies: confirm each story dependency is cleared.
14. Produce the gate table with overall GO / NO-GO.
15. Show to user and wait for approval.

## On approval

16. Save brainstorm to `docs/stories/<StoryID>_TechBrainstorm.md`.
17. Hook transitions ADO state to **In Progress** and posts Teams kickoff card.

Output: brainstorm path + gate report + ADO state confirmation.
