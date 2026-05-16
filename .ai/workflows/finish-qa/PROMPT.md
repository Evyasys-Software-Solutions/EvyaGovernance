# Prompt: /evyasys:FinishQa <StoryID>

You are the Release Manager / Senior QA described in `AGENT.md`.

## Inputs
- StoryID from `$ARGUMENTS`
- Story folder: find via Glob `.evyasys/board/**/<id>/`
- Story: `<story-folder>/<id>_UserStory.md` — read **Impacted Areas** domain flags
- Test Plan (with the QA team's recorded outcomes): `<story-folder>/<id>_TestPlan.md`
- Dev Summary: `<story-folder>/<id>_DevSummary.md`
- Rules: `.ai/rules/*.md`
- Project docs (load from `.evyasys/docs/` based on Impacted Areas flags):
  - Always: `TESTING.md`
  - Security flag → `SECURITY.md`
  - Performance flag → `PERFORMANCE.md`
  - Frontend flag → `DESIGN_SYSTEM.md`
  - DB flag → `DB_STANDARDS.md`
- Release notes template: `.ai/workflows/finish-qa/RELEASE_NOTES_TEMPLATE.md`

> **Note on test outcomes:** The QA team records pass/fail/blocked against each
> test case directly in `<id>_TestPlan.md` before running this command.
> If execution results are not yet recorded, stop and ask the user to fill them in first.

---

<HARD-GATE>
Do NOT produce release notes or approve Done until every test case has a recorded
outcome and all domain-specific gates below have been verified.
Evidence before claims — read the test plan, then state the result.
</HARD-GATE>

---

## Step 1 — TC outcome audit
Find the story folder by globbing `.evyasys/board/**/<id>/`. Read `<id>_TestPlan.md` from that folder.
For every test case listed, verify it has a recorded outcome: **Pass / Fail / Blocked**.
If any TC has no outcome recorded, list them and ask the user to update the file first.
**Do not proceed past this step until all TCs have outcomes.**

## Step 2 — Defect gate
Ask the user (or check if noted in the TestPlan): are any **P0 or P1** defects
currently open against this story?
- **P0** = critical / data loss / security hole
- **P1** = broken AC / regression in adjacent feature

If yes: list them. The gate cannot proceed. The user must either resolve them or
formally accept the risk and document it with a follow-up story ID.

## Step 3 — AC sign-off
For every Acceptance Criterion in the story, confirm:
- At least one test case in the plan covers it.
- That test case has a Pass outcome.
- Or the AC is formally waived by the Product Owner (with follow-up story ID noted).

## Step 4 — Domain-specific gates

Apply each gate only if the corresponding flag is set in **Impacted Areas**:

### Security gate (Security flag)
Using `SECURITY.md` as the checklist:
- Auth / authorisation tests executed and passed.
- Input validation tests executed and passed.
- No PII found in error responses, logs, or API payloads in any executed test.
Mark this gate: ✅ Pass / ❌ Fail / N/A — not flagged.

### Performance gate (Performance flag)
Using `PERFORMANCE.md` budgets:
- Response time measurements recorded.
- All measurements at or below documented threshold.
- Any measurement above threshold has a filed defect before sign-off.
Mark this gate: ✅ Pass / ❌ Fail / N/A — not flagged.

### Accessibility gate (Frontend flag)
Using `DESIGN_SYSTEM.md` accessibility requirements:
- Keyboard navigation verified through all new/changed interactive elements.
- ARIA labels confirmed on all interactive controls.
- Colour contrast confirmed against the documented standard.
Mark this gate: ✅ Pass / ❌ Fail / N/A — not flagged.

### Data integrity gate (DB flag)
Using `DB_STANDARDS.md`:
- Migration up/down verified in test environment.
- FK / cascade scenarios verified.
- No orphaned records introduced.
Mark this gate: ✅ Pass / ❌ Fail / N/A — not flagged.

## Step 5 — Architect gate
Review QA findings for doc gaps:
- If a security edge case was discovered that isn't in `SECURITY.md` → flag for update.
- If a performance threshold was exceeded and `PERFORMANCE.md` budget is wrong → flag for update.
- Note any flagged updates — they must be completed before the story is marked fully closed.

## Step 6 — Draft release notes
Fill `RELEASE_NOTES_TEMPLATE.md` exactly:
1. **What's new** — one short, plain-language paragraph. No class names, no jargon.
   Write as if explaining to a non-technical stakeholder.
2. **Changelog** — bullet list of what shipped (feature-level, not commit-level).
3. **Known limitations** — anything users should be aware of post-release.
4. **Roll-back** — steps to disable the feature, or "N/A — feature flag off by default".
5. **References** — story link, PR link, test plan path.

## Step 7 — Self-review
Run `CHECKLIST.md`. All items must pass before showing output.

## Step 8 — Show and confirm
Present the release notes and gate summary to the user.
Wait for explicit approval before the hook transitions ADO to Done.

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_ReleaseNotes.md`
- ADO state → **Done**
- Teams release card posted
