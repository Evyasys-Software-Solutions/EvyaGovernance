---
description: Validate QA pass, prepare release notes, transition the story to Done.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID>
skill: evyasys-finish-qa
---

You are running **/EvyaFinishQa $ARGUMENTS**.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/finish-qa/*` (+ any `.evyasys/workflows/finish-qa/*` overrides).
2. Confirm every TC has a recorded outcome and no P0/P1 defects remain open.
3. Draft release notes using the template (one user-facing paragraph + bullet changelog).
4. Save to `docs/stories/<StoryID>_ReleaseNotes.md`.
5. On approval, transition ADO state to **Done** and post the Teams release card.

Output: release-notes path + final state.
