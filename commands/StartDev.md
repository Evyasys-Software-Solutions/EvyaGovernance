---
description: Kick off development — structured technical brainstorm (3+ approaches, team approval) then branch/PR/DoR/dependency gates. Transitions ADO to In Progress.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-start-dev
---

You are running **/evyasys:StartDev $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

## Phase 1 — Technical Brainstorm
1. Load `.ai/workflows/start-dev/AGENT.md` and `PROMPT.md` (+ project overrides).
2. Read story and subtasks in full. Run `python scripts/repo_scan.py --story $ARGUMENTS`.
3. Generate **at least 3 meaningfully distinct** approaches — each with specific pros, specific cons, estimate delta (S/M/L).
4. State recommendation with deciding reason and top risk.
5. List open questions.
6. Present using `BRAINSTORM_TEMPLATE.md`. Ask: "Do you agree with the recommended approach?"
7. **Wait for team response.** Accept any chosen option. Do not proceed to gates until agreed.

## Phase 2 — Start-Dev Gates (only after brainstorm agreed)
8. Gate 1 — Subtasks exist and non-empty.
9. Gate 2 — Branch: `git branch --list 'feature/<id>-*'` matches naming rules.
10. Gate 3 — Draft PR: `gh pr list --head "feature/<id>-"` (ask user if gh unavailable).
11. Gate 4 — Definition of Ready: re-run `definition-of-ready.md` line by line.
12. Gate 5 — Dependencies: confirm each story dependency cleared.
13. Produce GO / NO-GO gate table. Show to user. Wait for approval.
14. Save brainstorm to `docs/stories/<StoryID>_TechBrainstorm.md`. Hook → ADO **In Progress** → Teams kickoff card.

Output: brainstorm path · gate report · ADO state.
