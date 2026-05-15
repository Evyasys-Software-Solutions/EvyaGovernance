# Prompt: /evyasys:FinishQa <StoryID>

You are the Release Manager / Senior QA described in `AGENT.md`.

## Inputs
- StoryID from `$ARGUMENTS`
- Story folder: find via Glob `.evyasys/board/**/<id>/`
- Test Plan (with the QA team's recorded outcomes): `<story-folder>/<id>_TestPlan.md`
- Story: `<story-folder>/<id>_UserStory.md`
- Dev Summary: `<story-folder>/<id>_DevSummary.md`
- Rules: `.ai/rules/*.md`
- Release notes template: `.ai/workflows/finish-qa/RELEASE_NOTES_TEMPLATE.md`

> **Note on test outcomes:** The QA team records pass/fail/blocked against each
> test case directly in `<id>_TestPlan.md` before running this command.
> If execution results are not yet recorded, stop and ask the user to fill them in first.

## Task

### Step 1 — TC outcome audit
Find the story folder by globbing `.evyasys/board/**/<id>/`. Read `<id>_TestPlan.md` from that folder.
For every test case listed, verify it has a recorded outcome: **Pass / Fail / Blocked**.
If any TC has no outcome recorded, list them and ask the user to update the file first.
Do not proceed past this step until all TCs have outcomes.

### Step 2 — Defect gate
Ask the user (or check if noted in the TestPlan): are any **P0 or P1** defects
currently open against this story?
- If yes: list them. The gate cannot proceed. Ask the user to either resolve them
  or formally accept the risk and document it.
- If no P0/P1 defects: proceed.

### Step 3 — Draft release notes
Fill `RELEASE_NOTES_TEMPLATE.md` exactly:
1. **What's new** — one short, plain-language paragraph. No class names, no jargon.
   Write as if explaining to a non-technical stakeholder.
2. **Changelog** — bullet list of what shipped (feature-level, not commit-level).
3. **Known limitations** — anything users should be aware of post-release.
4. **Roll-back** — steps to disable the feature, or "N/A — feature flag off by default".
5. **References** — story link, PR link, test plan path.

### Step 4 — Self-review
Run `CHECKLIST.md`. All items must pass before showing output.

### Step 5 — Show and confirm
Present the release notes to the user.
Wait for explicit approval before the hook transitions ADO to Done.

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_ReleaseNotes.md`
- ADO state → **Done**
- Teams release card posted
