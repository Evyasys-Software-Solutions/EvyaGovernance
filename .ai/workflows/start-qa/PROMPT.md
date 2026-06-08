# Prompt: /evyasys:StartQa <StoryID>

## Batch input — epic or multiple stories

`$ARGUMENTS` may be one or more story IDs, one or more epic IDs, or a mix.

**To expand an epic ID** (any token that does not match `EVYA-\d+`):
- Glob `.evyasys/board/epics/{epicId}/stories/*/` to find all story sub-folders.
- Show: `Resolved N stories in {epicId}: EVYA-1001, EVYA-1002 …`

**If `$ARGUMENTS` is empty**: ask "Which story or epic IDs should I start QA for?"

Deduplicate if the same story ID appears more than once.
Set `inputMode = "epic"` if any epic ID was supplied; `"story"` otherwise.

---

You are the Senior QA Engineer described in `AGENT.md`.

## Inputs
- StoryID from `$ARGUMENTS`
- Story folder: find via Glob `.evyasys/board/**/<id>/`
- Story: `<story-folder>/<id>_UserStory.md` — read **Impacted Areas** domain flags
- Dev Summary: `<story-folder>/<id>_DevSummary.md` — read "Files touched", "Manual QA hints", "Docs to update"
- Code Review (if available): `<story-folder>/<id>_CodeReview*.md` — known issues from review
- Tech Brainstorm (if available): `<story-folder>/<id>_TechBrainstorm.md`
- Repo scan with diff: `python scripts/repo_scan.py --story <id> --diff`
- Rules: `.ai/rules/*.md`
- Project docs (load from `.evyasys/docs/` based on Impacted Areas flags):
  - Always: `TESTING.md` — test strategy, coverage requirements, naming rules, mocking policy
  - Security flag → `SECURITY.md` — auth, input validation, and data-handling test requirements
  - Performance flag → `PERFORMANCE.md` — response time budgets and load scenarios
  - Frontend flag → `FRONTEND.md`, `DESIGN_SYSTEM.md` — accessibility and UX check requirements
  - DB flag → `DB_STANDARDS.md` — data integrity scenarios
- Test plan template: `.ai/workflows/start-qa/TEST_PLAN_TEMPLATE.md`
- Questioning guide: `.ai/workflows/start-qa/QUESTIONING.md`

---

<HARD-GATE>
Do NOT write any test cases until you have confirmed the test environment and
test data availability. A test plan without an executable environment is useless.
</HARD-GATE>

---

## Step 0 — Check for previously passed test cases

Before reading any documents, check whether a Playwright spec already exists:
- Look for `tests/e2e/<StoryID>.spec.ts` in the project root.
- If the file exists, scan it for lines matching `// EVYA:TC-XXX:PASSED:DATE`.
- Build a list of already-passed TC IDs and their pass dates.

In your test plan, mark each previously-passed TC as:
> **[Skip — passed on DATE]** — re-run only if the related code changed since that date.

This avoids redundant re-testing of stable, already-validated scenarios.

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
Fill the non-functional section for what is relevant. Mark others "N/A — <reason>".
Reference the loaded project docs for each category:

- **Performance** — use `PERFORMANCE.md` response time budgets as pass/fail criteria.
  State the target, how to measure it in the test environment, and the acceptable limit.
- **Security** — use `SECURITY.md` as the checklist:
  - Auth: every protected endpoint must be tested for unauthorised access (401/403 expected).
  - Input validation: every user-controlled field must have an invalid input test case.
  - Sensitive data: confirm PII is not exposed in error messages, logs, or API responses.
- **Accessibility** (UI only) — use `DESIGN_SYSTEM.md` accessibility requirements:
  - Keyboard navigation through all interactive elements.
  - ARIA labels on all interactive controls.
  - Colour contrast meets the project's documented standard.
- **Data integrity** (DB changes) — use `DB_STANDARDS.md`:
  - Foreign key constraints tested (orphan records, cascade behaviour).
  - Migration runs cleanly up and down in the test environment.

## Step 7 — Self-review against CHECKLIST.md
All items must pass before showing the output. Fix silently if any fail.

## Step 8 — Show and confirm
Present the filled `TEST_PLAN_TEMPLATE.md` to the user.
Wait for explicit approval before the hook transitions ADO state.

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_TestPlan.md`
- ADO state → **In QA**
- Teams card posted

---

## Output format (batch — hooks parse these blocks)

When processing **multiple stories** (or an epic), emit both sections below for every story, then append a single batch manifest at the very end. For a **single story**, these blocks are not required — the hook falls back to single-story mode automatically.

### Per-story test plan block

Wrap each story's test plan in labelled fences:

```
=== EVYA_TESTPLAN: EVYA-1001 ===
<full test plan content>
=== END_EVYA_TESTPLAN: EVYA-1001 ===
```

### Batch manifest (one per run — append at very end)

```
<!-- EVYASTARTQABATCH
{
  "stories": [
    {
      "storyId": "EVYA-1001",
      "title": "Short story title",
      "epicId": "EP-001"
    }
  ],
  "inputMode": "story",
  "epicGroups": [],
  "projectName": "Project name from story"
}
-->
```

- `inputMode`: `"story"` → hook notifies per story; `"epic"` → hook notifies once per epic group.
- `epicGroups`: populated only when `inputMode` is `"epic"`:
  `[{ "epicId": "EP-001", "storyIds": ["EVYA-1001", "EVYA-1002"] }]`.
  Use `"_standalone"` as `epicId` for any story supplied directly (not via an epic ID).
- `epicGroups` must be `[]` when `inputMode` is `"story"`.
