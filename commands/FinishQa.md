---
description: Release sign-off — verifies all TC outcomes recorded, no P0/P1 defects open, drafts plain-language release notes. Transitions ADO to Done.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-finish-qa
---

You are running **/evyasys:FinishQa $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/finish-qa/*` (+ project overrides).
2. Find the story folder by globbing `.evyasys/board/**/<StoryID>/`. Read `<StoryID>_TestPlan.md` from that folder. If any TC has no recorded outcome (pass/fail/blocked), stop and ask the user to fill it in first. **Do not proceed until all TCs have outcomes.**
3. Verify no P0/P1 defects remain open against this story. If yes: list them. Gate cannot proceed until resolved or formally accepted.
4. Draft release notes using `RELEASE_NOTES_TEMPLATE.md`: one plain-language paragraph (no jargon, no class names), bullet changelog, known limitations, roll-back plan.
5. Self-review against `CHECKLIST.md`. Show to user and wait for approval.
6. On approval → save `<StoryID>_ReleaseNotes.md` to story folder → ADO **Done** → Teams release card.

Output: release notes path · ADO state.
