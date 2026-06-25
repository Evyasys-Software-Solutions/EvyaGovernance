# Prompt: /evyasys:FinishQa <StoryID>

## Batch input — epic or multiple stories

`$ARGUMENTS` may be one or more story IDs, one or more epic IDs, or a mix.

**To expand an epic ID** (any token that does not match `EVYA-\d+`):
- Glob `.evyasys/board/epics/{epicId}/stories/*/` to find all story sub-folders.
- Show: `Resolved N stories in {epicId}: EVYA-1001, EVYA-1002 …`

**If `$ARGUMENTS` is empty**: ask "Which story or epic IDs should I finish QA for?"

Deduplicate if the same story ID appears more than once.
Set `inputMode = "epic"` if any epic ID was supplied; `"story"` otherwise.

---

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
  - Frontend flag → `DESIGN_SYSTEM.md`, `fe/ACCESSIBILITY.md` (if exists), `fe/VISUAL_QUALITY.md` (if exists)
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

### Accessibility & Visual Quality gate (Frontend flag)
Using `fe/ACCESSIBILITY.md` (if it exists, else `DESIGN_SYSTEM.md`) as the checklist:
- Colour contrast verified for all new/changed text and UI components (≥ 4.5:1 body text, ≥ 3:1 large text and UI components).
- Keyboard navigation verified through all new/changed interactive elements — no keyboard traps.
- Every icon-only button, custom widget, and form error has the required ARIA attributes.
- Focus visible on all focusable elements with no bare `outline: none`.
- Automated accessibility scan run (`axe`, `jest-axe`, or Lighthouse) with zero new violations if tooling is available.

Using `fe/VISUAL_QUALITY.md` (if it exists) for interactive state completeness:
- Every new/changed interactive component implements all required states (hover, focus-visible, disabled, loading, error, empty).
- All transitions and animations have a `@media (prefers-reduced-motion: reduce)` override.
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

---

## Final output blocks (required — appended after release notes)

After the confirmed release notes, append **exactly two** structured blocks in this order.
These are parsed by the hook — they are never saved to the release notes file.

### Block 1 — TC outcomes (all TCs, every outcome)

```
<!-- EVYATCRESULTS
[
  { "id": "TC-001", "status": "PASSED", "date": "YYYY-MM-DD" },
  { "id": "TC-002", "status": "FAILED", "date": "YYYY-MM-DD" },
  { "id": "TC-003", "status": "BLOCKED", "date": "YYYY-MM-DD" }
]
-->
```

- Include every TC from the test plan.
- `status` is one of: `PASSED` | `FAILED` | `BLOCKED`.
- `date` is today's date in ISO format.
- The hook uses PASSED entries to update the Playwright spec (`test.skip(true, 'PASSED on DATE')`).

### Block 2 — Bugs found (only if defects were found during QA)

```
<!-- EVYABUGS
[
  {
    "title": "Short descriptive title",
    "description": "Steps to reproduce and expected vs actual behaviour",
    "severity": 2,
    "tcId": "TC-002"
  }
]
-->
```

- Include only bugs/defects discovered during this QA cycle.
- `severity`: 1 = Critical (P1), 2 = High (P2), 3 = Medium (P3), 4 = Low (P4).
- `tcId`: the TC that revealed this bug (optional but recommended).
- If no bugs were found, emit an empty array: `<!-- EVYABUGS [] -->`.
- The hook creates these as Bug work items in the PM tool linked to the parent story.
- **Severity 1–2 bugs block release**: the story remains In QA until fixed.
- **Severity 3–4 bugs only**: story is marked Done; bugs are logged for the next sprint.

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_ReleaseNotes.md`
- ADO state → **Done** (or stays **In QA** if P1/P2 bugs found)
- Bug work items created in ADO (linked to story)
- Teams release card posted (or bug-found card if blocking bugs)

---

## Output format (batch — hooks parse these blocks)

When processing **multiple stories** (or an epic), use the qualified block format below instead of the unqualified blocks above. For a **single story**, the unqualified `<!-- EVYATCRESULTS -->` and `<!-- EVYABUGS -->` blocks (defined in "Final output blocks" above) remain in effect — the hook falls back to single-story mode automatically.

### Per-story release notes block

Wrap each story's release notes in labelled fences:

```
=== EVYA_RELEASENOTES: EVYA-1001 ===
<full release notes content>
=== END_EVYA_RELEASENOTES: EVYA-1001 ===
```

### Per-story TC results block (qualified — replaces unqualified tag in batch mode)

Emit immediately after each story's release notes block:

```
<!-- EVYATCRESULTS:EVYA-1001
[
  { "id": "TC-001", "status": "PASSED", "date": "YYYY-MM-DD" },
  { "id": "TC-002", "status": "FAILED", "date": "YYYY-MM-DD" }
]
-->
```

### Per-story bugs block (qualified — replaces unqualified tag in batch mode)

Emit immediately after the TC results block for each story:

```
<!-- EVYABUGS:EVYA-1001
[
  {
    "title": "Short descriptive title",
    "description": "Steps to reproduce and expected vs actual behaviour",
    "severity": 2,
    "tcId": "TC-002"
  }
]
-->
```

If no bugs were found for a story, emit: `<!-- EVYABUGS:EVYA-1001 [] -->`

### Batch manifest (one per run — append at very end)

```
<!-- EVYAFINISHQABATCH
{
  "stories": [
    {
      "storyId": "EVYA-1001",
      "title": "Short story title",
      "hasBlockingBugs": false,
      "epicId": "EP-001"
    }
  ],
  "inputMode": "story",
  "epicGroups": [],
  "projectName": "Project name from story"
}
-->
```

- `hasBlockingBugs`: `true` if any severity 1–2 bugs were found for this story (story stays In QA); `false` otherwise.
- `inputMode`: `"story"` → hook notifies per story; `"epic"` → hook notifies once per epic group.
- `epicGroups`: populated only when `inputMode` is `"epic"`:
  `[{ "epicId": "EP-001", "storyIds": ["EVYA-1001", "EVYA-1002"] }]`.
  Use `"_standalone"` as `epicId` for any story supplied directly (not via an epic ID).
- `epicGroups` must be `[]` when `inputMode` is `"story"`.
