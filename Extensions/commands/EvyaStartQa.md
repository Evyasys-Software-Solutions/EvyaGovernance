---
description: Generate a comprehensive test plan — asks clarifying questions one at a time (environment, test data, flaky areas), then writes AC-driven positive/negative/edge/regression/non-functional cases using Gherkin where useful. Transitions ADO to In QA on approval.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-start-qa
---

You are running **/EvyaStartQa $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/start-qa/*` (+ any `.evyasys/workflows/start-qa/*` overrides).
2. Read story (`docs/stories/<StoryID>_UserStory.md`), dev summary (`<StoryID>_DevSummary.md`), and run `python scripts/repo_scan.py --story $ARGUMENTS --diff`.
3. Follow `QUESTIONING.md` — ask one question at a time about: test environment (required), test data (required if stateful), known flaky areas, browser/device matrix (UI only). Wait for each answer before asking the next.
4. Only after environment and data are confirmed, write the test plan using `TEST_PLAN_TEMPLATE.md`: AC-driven positive + negative cases, edge cases, regression checks for every file touched, non-functional section (perf/security/a11y or N/A with reason). Use Gherkin for multi-step scenarios.
5. Self-review against `CHECKLIST.md`. Fix any failures before showing.
6. Show the test plan to the user and wait for approval.
7. On approval, save to `docs/stories/<StoryID>_TestPlan.md`, transition ADO to **In QA**, post Teams card.

Output: test-plan path + ADO state transition.
