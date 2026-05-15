---
description: Generate a comprehensive test plan — confirms environment and test data first, then AC-driven positive/negative/edge/regression/non-functional cases with Gherkin. Transitions ADO to In QA.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-start-qa
---

You are running **/evyasys:StartQa $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/start-qa/*` (+ project overrides).
2. Find the story folder by globbing `.evyasys/board/**/<StoryID>/`. Read `<StoryID>_UserStory.md`, `<StoryID>_DevSummary.md`, and `<StoryID>_CodeReview.md` (if available) from that folder. Run `python scripts/repo_scan.py --story $ARGUMENTS --diff`.
3. Ask clarifying questions one at a time per `QUESTIONING.md` (environment required, test data required if stateful, flaky areas, browser matrix for UI). Wait for each answer. **Do not write test cases until environment and data are confirmed.**
4. Write test plan using `TEST_PLAN_TEMPLATE.md`: for every AC write ≥ 1 positive + ≥ 1 negative case. Add edge cases, regression checks for every touched file, non-functional section (perf/security/a11y or N/A with reason). Use Gherkin for multi-step scenarios.
5. Self-review against `CHECKLIST.md`. Show to user and wait for approval.
6. On approval → save `<StoryID>_TestPlan.md` to story folder → ADO **In QA** → Teams card.

Output: test plan path · ADO state.
