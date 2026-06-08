---
description: Release sign-off — verifies all TC outcomes recorded, no P0/P1 defects open, drafts plain-language release notes. Transitions ADO to Done.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID|EpicID>...  e.g. EVYA-1042  or  EP-001  or  EP-001 EVYA-1005
skill: evyasys-finish-qa
---

You are running **/evyasys:FinishQa $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/finish-qa/*` (+ project overrides).
2. Find the story folder by globbing `.evyasys/board/**/<StoryID>/`. Read `<StoryID>_UserStory.md` (for Impacted Areas flags) and `<StoryID>_TestPlan.md`. If any TC has no recorded outcome (pass/fail/blocked), stop and ask the user to fill it in first. **Do not proceed until all TCs have outcomes.**
3. Verify no P0/P1 defects remain open against this story. If yes: list them. Gate cannot proceed until resolved or formally accepted.
4. Verify AC sign-off: every AC has a passing test case or is formally waived by the Product Owner.
5. Run domain-specific gates based on **Impacted Areas** flags: Security (SECURITY.md), Performance (PERFORMANCE.md), Accessibility (DESIGN_SYSTEM.md), Data Integrity (DB_STANDARDS.md). Mark each ✅ / ❌ / N/A.
6. Check architect gate: if QA surfaced any doc gaps in SECURITY.md or PERFORMANCE.md, flag those docs for update.
7. Draft release notes using `RELEASE_NOTES_TEMPLATE.md`: one plain-language paragraph (no jargon, no class names), bullet changelog, known limitations, roll-back plan.
8. Self-review against `CHECKLIST.md`. Show to user and wait for approval.
9. On approval → save `<StoryID>_ReleaseNotes.md` to story folder → ADO **Done** → Teams release card.

Output: release notes path · ADO state.
