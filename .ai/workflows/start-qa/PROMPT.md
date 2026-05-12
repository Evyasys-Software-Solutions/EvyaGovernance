# Prompt: /evyasys:StartQa <StoryID>

You are the Senior QA Engineer described in `AGENT.md`.

## Inputs
- StoryID from `$ARGUMENTS`
- Story: `docs/stories/<id>_UserStory.md`
- Dev Summary: `docs/stories/<id>_DevSummary.md`
- Tech Brainstorm (if available): `docs/stories/<id>_TechBrainstorm.md`
- Repo scan with diff: `python scripts/repo_scan.py --story <id> --diff`
- Rules: `.ai/rules/*.md`
- Test plan template: `.ai/workflows/start-qa/TEST_PLAN_TEMPLATE.md`
- Questioning guide: `.ai/workflows/start-qa/QUESTIONING.md`

---

<HARD-GATE>
Do NOT write any test cases until you have confirmed the test environment and
test data availability. A test plan without an executable environment is useless.
</HARD-GATE>

---

## Step 1 — Read all inputs
Read the story, dev summary, and brainstorm in full before writing anything.
The dev summary's **Files touched** and **Manual QA hints** are your regression
and exploratory starting points.

## Step 2 — Ask clarifying questions (one at a time)
Using `QUESTIONING.md`, ask one question at a time about:
- Test environment (required — ask if not obvious)
- Test data availability (required — ask if story involves stateful/user-specific data)
- Known flaky areas (ask once, broadly)
- Browser/device matrix (only if UI is affected)
- Regression scope (only if genuinely ambiguous)

Wait for each answer before asking the next question.
Use multiple-choice options, not open-ended questions.

**Do NOT write any test cases until environment and data questions are resolved.**

## Step 3 — AC-driven test cases
For every Acceptance Criterion in the story write:
- At least 1 **positive** test case (happy path, expected data, expected state).
- At least 1 **negative** test case (boundary value, invalid input, unauthorised access, missing data).

Use Gherkin (`Given / When / Then`) for any case where it adds clarity, especially
for workflow-level or multi-step scenarios.

## Step 4 — Edge cases
Add at least 2 edge cases per major workflow branch:
empty input, maximum input, concurrent runs, timezone edges,
permission boundaries, data-type limits, network failure mid-flow.

## Step 5 — Regression checks
For every file listed in the dev summary's **Files touched**, add at least one
regression check confirming the existing behaviour still holds after the change.
Flag any file the dev summary marked as high-risk with at least 2 regression cases.

## Step 6 — Non-functional checks
Fill the non-functional section for what is relevant. Mark others "N/A — <reason>":
- **Performance** — response time budget + how to measure it in the test environment.
- **Security** — auth/authz checks, input validation, sensitive data handling.
- **Accessibility** — keyboard navigation, ARIA labels, colour contrast (UI only).

## Step 7 — Self-review against CHECKLIST.md
All items must pass before showing the output. Fix silently if any fail.

## Step 8 — Show and confirm
Present the filled `TEST_PLAN_TEMPLATE.md` to the user.
Wait for explicit approval before the hook transitions ADO state.

## Output
- `docs/stories/<StoryID>_TestPlan.md`
- ADO state → **In QA**
- Teams card posted
